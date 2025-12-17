import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { InitialProfileData } from "@/types/onboarding";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (authError || !user) {
    redirect("/login");
  }

  // 프로필 전체 데이터 조회 (관리자가 입력한 정보 포함)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 이미 온보딩을 완료한 경우 대시보드로 리다이렉트
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  // 사용자 이름 가져오기 (Auth metadata에서)
  const userName = (user.user_metadata?.name as string) || "회원";

  // 초기 프로필 데이터 (관리자가 입력한 정보)
  const initialProfile: InitialProfileData | null = profile
    ? {
        org_level1: profile.org_level1,
        org_level2: profile.org_level2,
        org_level3: profile.org_level3,
        job_position: profile.job_position,
        office_location: profile.office_location,
        department: profile.department,
        mbti: profile.mbti,
        age_range: profile.age_range,
        living_location: profile.living_location,
        hometown: profile.hometown,
        education: profile.education,
        work_description: profile.work_description,
        tech_stack: profile.tech_stack,
        certifications: profile.certifications,
        languages: profile.languages,
        interests: profile.interests,
        favorite_food: profile.favorite_food,
        collaboration_style: profile.collaboration_style,
        strengths: profile.strengths,
        preferred_people_type: profile.preferred_people_type,
        career_goals: profile.career_goals,
      }
    : null;

  return (
    <OnboardingWizard
      userId={user.id}
      userName={userName}
      initialProfile={initialProfile}
    />
  );
}
