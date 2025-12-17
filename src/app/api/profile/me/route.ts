import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["preferences"]["Row"];

// GET /api/profile/me - Get current user's profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single<UserRow>();

    if (userError && userError.code !== "PGRST116") {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { success: false, error: "사용자 정보를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single<ProfileRow>();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "프로필 정보를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // Get tags if profile exists
    let hobbies: string[] = [];
    if (profile) {
      const { data: tags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", profile.id);

      hobbies = tags?.map((t: { tag_name: string }) => t.tag_name) || [];
    }

    // Get preferences
    const { data: preferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single<PreferencesRow>();

    return NextResponse.json({
      success: true,
      data: {
        id: profile?.id || null,
        userId: user.id,
        email: user.email,
        name: userData?.name || user.user_metadata?.name || "",
        avatarUrl: userData?.avatar_url || null,
        department: profile?.department || "",
        jobRole: profile?.job_role || "",
        officeLocation: profile?.office_location || "",
        mbti: profile?.mbti || null,
        hobbies,
        collaborationStyle: profile?.collaboration_style || null,
        strengths: profile?.strengths || null,
        preferredPeopleType: profile?.preferred_people_type || null,
        // 새 필드
        livingLocation: profile?.living_location || null,
        hometown: profile?.hometown || null,
        education: profile?.education || null,
        workDescription: profile?.work_description || null,
        techStack: profile?.tech_stack || null,
        favoriteFood: profile?.favorite_food || null,
        ageRange: profile?.age_range || null,
        interests: profile?.interests || null,
        careerGoals: profile?.career_goals || null,
        certifications: profile?.certifications || null,
        languages: profile?.languages || null,
        // 설정
        visibilitySettings: profile?.visibility_settings || {
          department: "public",
          job_role: "public",
          office_location: "public",
          mbti: "public",
          hobbies: "public",
          collaboration_style: "public",
          strengths: "public",
          preferred_people_type: "public",
          // 새 필드 기본값
          living_location: "public",
          hometown: "public",
          education: "public",
          work_description: "public",
          tech_stack: "public",
          favorite_food: "public",
          age_range: "public",
          interests: "public",
          career_goals: "public",
          certifications: "public",
          languages: "public",
        },
        role: profile?.role || "user",
        isProfileComplete: profile?.is_profile_complete || false,
        preferences: preferences
          ? {
              preferredDepartments: preferences.preferred_departments,
              preferredJobRoles: preferences.preferred_job_roles,
              preferredLocations: preferences.preferred_locations,
              preferredMbtiTypes: preferences.preferred_mbti_types,
              embeddingWeight: preferences.embedding_weight,
              tagWeight: preferences.tag_weight,
              preferenceWeight: preferences.preference_weight,
            }
          : null,
        createdAt: profile?.created_at || null,
        updatedAt: profile?.updated_at || null,
      },
    });
  } catch (error) {
    console.error("Profile me API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
