"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError(error.message);
        }
        return;
      }

      // 로그인 성공 후 user 정보로 역할 및 온보딩 상태 확인
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("user_id", data.user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin/cohorts");
        } else if (!profile?.onboarding_completed) {
          // 온보딩 미완료 사용자는 온보딩 페이지로 리다이렉트
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">sureUs</CardTitle>
        <CardDescription className="text-center">
          신입사원 온보딩 서비스에 로그인하세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 (초기 비밀번호 : suresoft1!)</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
