import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Search, Sparkles, Network, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if profile exists (user is guaranteed by layout)
  let hasProfile = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_profile_complete")
      .eq("user_id", user.id)
      .single<{ is_profile_complete: boolean }>();
    hasProfile = profile?.is_profile_complete ?? false;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-1">
          sureNet에 오신 것을 환영합니다
        </p>
      </div>

      {!hasProfile && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              프로필을 완성하세요
            </CardTitle>
            <CardDescription>
              프로필을 완성하면 나와 비슷한 관심사를 가진 동료를 찾을 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile/edit">
              <Button>
                프로필 작성하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/search">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>동료 검색</CardTitle>
              <CardDescription>
                이름, 부서, 관심사로 동료를 검색하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/recommendations">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>추천 동료</CardTitle>
              <CardDescription>
                나와 비슷한 관심사와 업무 스타일을 가진 동료를 발견하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/network">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                <Network className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>네트워크 그래프</CardTitle>
              <CardDescription>
                사내 연결 관계를 시각적으로 탐색하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {hasProfile && (
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              아직 활동 내역이 없습니다. 동료를 검색하거나 추천을 확인해보세요!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
