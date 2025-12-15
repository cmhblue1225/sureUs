import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { UserProfile } from "@/types/profile";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData: Partial<UserProfile> = {};

  if (user) {
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
        department: profile.department,
        jobRole: profile.job_role,
        officeLocation: profile.office_location,
        mbti: profile.mbti || undefined,
        hobbies: tags?.map((t: { tag_name: string }) => t.tag_name) || [],
        collaborationStyle: profile.collaboration_style || undefined,
        strengths: profile.strengths || undefined,
        preferredPeopleType: profile.preferred_people_type || undefined,
        visibilitySettings: profile.visibility_settings,
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

      <ProfileForm initialData={initialData} />
    </div>
  );
}
