import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { profileFormSchema } from "@/lib/utils/validation";
import { generateProfileEmbeddings } from "@/lib/openai/embeddings";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// POST /api/profile - Create or update profile
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = profileFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "잘못된 데이터 형식입니다.",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single<{ id: string }>();

    // Determine if all required text fields are filled for is_profile_complete
    const isComplete = !!(
      data.department &&
      data.jobRole &&
      data.officeLocation &&
      data.hobbies.length > 0
    );

    const profileData = {
      user_id: user.id,
      department: data.department,
      job_role: data.jobRole,
      office_location: data.officeLocation,
      mbti: data.mbti || null,
      collaboration_style: data.collaborationStyle || null,
      strengths: data.strengths || null,
      preferred_people_type: data.preferredPeopleType || null,
      visibility_settings: data.visibilitySettings,
      is_profile_complete: isComplete,
    };

    let profile;

    if (existingProfile) {
      // Update existing profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedProfile, error: updateError } = await (supabase.from("profiles") as any)
        .update(profileData as ProfileUpdate)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Profile update error:", updateError);
        return NextResponse.json(
          { success: false, error: "프로필 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }

      profile = updatedProfile as ProfileRow;
    } else {
      // Create new profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newProfile, error: insertError } = await (supabase.from("profiles") as any)
        .insert(profileData as ProfileInsert)
        .select()
        .single();

      if (insertError) {
        console.error("Profile insert error:", insertError);
        return NextResponse.json(
          { success: false, error: "프로필 생성에 실패했습니다." },
          { status: 500 }
        );
      }

      profile = newProfile as ProfileRow;
    }

    // Handle tags - delete existing and insert new
    if (profile) {
      // Delete existing tags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profile_tags") as any)
        .delete()
        .eq("profile_id", profile.id);

      // Insert new tags
      if (data.hobbies.length > 0) {
        const tagData = data.hobbies.map((tag) => ({
          profile_id: profile.id,
          tag_name: tag,
          tag_category: "hobby",
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: tagError } = await (supabase.from("profile_tags") as any)
          .insert(tagData);

        if (tagError) {
          console.error("Tag insert error:", tagError);
        }
      }
    }

    // Generate embeddings synchronously
    let embeddingsGenerated = false;

    if (data.collaborationStyle || data.strengths || data.preferredPeopleType) {
      try {
        const embeddings = await generateProfileEmbeddings({
          collaborationStyle: data.collaborationStyle,
          strengths: data.strengths,
          preferredPeopleType: data.preferredPeopleType,
        });

        if (embeddings) {
          // Use service client to bypass RLS
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // Upsert embeddings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: embeddingError } = await (serviceClient.from("embeddings") as any)
            .upsert({
              user_id: user.id,
              combined_embedding: JSON.stringify(embeddings.combinedEmbedding),
              collaboration_style_embedding: embeddings.collaborationStyleEmbedding
                ? JSON.stringify(embeddings.collaborationStyleEmbedding)
                : null,
              strengths_embedding: embeddings.strengthsEmbedding
                ? JSON.stringify(embeddings.strengthsEmbedding)
                : null,
              preferred_people_type_embedding: embeddings.preferredPeopleTypeEmbedding
                ? JSON.stringify(embeddings.preferredPeopleTypeEmbedding)
                : null,
              source_text_hash: embeddings.sourceTextHash,
              generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (embeddingError) {
            console.error("Embedding save error:", embeddingError);
          } else {
            embeddingsGenerated = true;
          }
        }
      } catch (embeddingErr) {
        console.error("Embedding generation error:", embeddingErr);
        // Continue without embeddings - not a critical failure
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        userId: profile.user_id,
        department: profile.department,
        jobRole: profile.job_role,
        officeLocation: profile.office_location,
        mbti: profile.mbti,
        hobbies: data.hobbies,
        collaborationStyle: profile.collaboration_style,
        strengths: profile.strengths,
        preferredPeopleType: profile.preferred_people_type,
        visibilitySettings: profile.visibility_settings,
        isProfileComplete: profile.is_profile_complete,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      meta: {
        embeddingsGenerated,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
