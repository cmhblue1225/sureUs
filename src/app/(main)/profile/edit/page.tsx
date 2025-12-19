import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { UserProfile } from "@/types/profile";
import type { Database, VisibilitySettings } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData: Partial<UserProfile> = {};
  let currentAvatarUrl: string | null = null;

  if (user) {
    // Get user's avatar_url
    const { data: userData } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single<{ avatar_url: string | null }>();

    currentAvatarUrl = userData?.avatar_url || null;

    // Get existing profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single<ProfileRow>();

    if (profile) {
      // Get tags
      const { data: tags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", profile.id);

      initialData = {
        // 새로운 조직 구조 필드
        orgLevel1: profile.org_level1 || undefined,
        orgLevel2: profile.org_level2 || undefined,
        orgLevel3: profile.org_level3 || undefined,
        jobPosition: profile.job_position || undefined,
        // 하위 호환성 필드
        department: profile.department,
        jobRole: profile.job_role,
        officeLocation: profile.office_location,
        mbti: profile.mbti || undefined,
        hobbies: tags?.map((t: { tag_name: string }) => t.tag_name) || [],
        collaborationStyle: profile.collaboration_style || undefined,
        strengths: profile.strengths || undefined,
        preferredPeopleType: profile.preferred_people_type || undefined,
        // 새 필드
        livingLocation: profile.living_location || undefined,
        hometown: profile.hometown || undefined,
        education: profile.education || undefined,
        workDescription: profile.work_description || undefined,
        techStack: profile.tech_stack || undefined,
        favoriteFood: profile.favorite_food || undefined,
        ageRange: profile.age_range || undefined,
        interests: profile.interests || undefined,
        careerGoals: profile.career_goals || undefined,
        certifications: profile.certifications || undefined,
        languages: profile.languages || undefined,
        // 설정
        visibilitySettings: profile.visibility_settings as unknown as VisibilitySettings | undefined,
      };
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">프로필 편집</h1>
        <p className="text-muted-foreground mt-1">
          나를 소개하고 비슷한 관심사를 가진 동료를 찾아보세요
        </p>
      </div>

      <ProfileForm initialData={initialData} currentAvatarUrl={currentAvatarUrl} />
    </div>
  );
}
