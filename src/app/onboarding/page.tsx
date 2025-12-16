import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

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

  // 이미 온보딩을 완료한 사용자인지 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .single<{ onboarding_completed: boolean | null }>();

  // 이미 온보딩을 완료한 경우 대시보드로 리다이렉트
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return <OnboardingWizard userId={user.id} />;
}
