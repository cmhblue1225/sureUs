import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database, VisibilityLevel } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface VisibilitySettings {
  hobbies?: VisibilityLevel;
  collaboration_style?: VisibilityLevel;
  strengths?: VisibilityLevel;
  preferred_people_type?: VisibilityLevel;
  mbti?: VisibilityLevel;
}

// GET /api/profile/[id] - Get a user's profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get target user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetUserId)
      .single<UserRow>();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get target user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single<ProfileRow>();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get hobbies/tags
    const { data: tags } = await supabase
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", profile.id);

    const hobbies = tags?.map((t: { tag_name: string }) => t.tag_name) || [];

    // Get current user's profile for comparison (department)
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("department")
      .eq("user_id", currentUser.id)
      .single<{ department: string }>();

    const isSameDepartment = currentUserProfile?.department === profile.department;
    const isOwnProfile = currentUser.id === targetUserId;

    // Helper to check if field should be visible
    const visibility = (profile.visibility_settings as VisibilitySettings) || {};

    const canView = (field: keyof VisibilitySettings): boolean => {
      if (isOwnProfile) return true;
      const level = visibility[field] || "public";
      if (level === "public") return true;
      if (level === "department" && isSameDepartment) return true;
      return false;
    };

    // Log profile view (only if not own profile)
    if (!isOwnProfile) {
      try {
        const serviceClient = createServiceClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient.from("profile_view_logs") as any).insert({
          viewer_id: currentUser.id,
          viewed_user_id: targetUserId,
          viewed_at: new Date().toISOString(),
        });
      } catch (logError) {
        console.error("Profile view log error:", logError);
        // Continue even if logging fails
      }
    }

    // Get common tags if current user has a profile
    let commonTags: string[] = [];
    if (currentUserProfile && !isOwnProfile) {
      const { data: currentUserTags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", currentUserProfile.department); // This won't work - need profile_id

      // Actually need to get current user's profile first
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", currentUser.id)
        .single<{ id: string }>();

      if (currentProfile) {
        const { data: myTags } = await supabase
          .from("profile_tags")
          .select("tag_name")
          .eq("profile_id", currentProfile.id);

        const myTagNames = myTags?.map((t: { tag_name: string }) => t.tag_name) || [];
        commonTags = hobbies.filter(h => myTagNames.includes(h));
      }
    }

    // Build response with visibility filtering
    const responseData = {
      id: profile.id,
      userId: profile.user_id,
      name: userData.name,
      avatarUrl: userData.avatar_url,
      department: profile.department,
      jobRole: profile.job_role,
      officeLocation: profile.office_location,
      mbti: canView("mbti") ? profile.mbti : null,
      hobbies: canView("hobbies") ? hobbies : [],
      collaborationStyle: canView("collaboration_style") ? profile.collaboration_style : null,
      strengths: canView("strengths") ? profile.strengths : null,
      preferredPeopleType: canView("preferred_people_type") ? profile.preferred_people_type : null,
      isProfileComplete: profile.is_profile_complete,
      isOwnProfile,
      isSameDepartment,
      commonTags,
      visibility: isOwnProfile ? visibility : undefined,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
