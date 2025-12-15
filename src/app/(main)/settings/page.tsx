"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmPhrase !== "DELETE MY ACCOUNT") {
      setError("확인 문구가 일치하지 않습니다.");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationPhrase: confirmPhrase }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      // Redirect to login after successful deletion
      router.push("/login");
    } catch (err) {
      setError("계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-1">
          계정 및 개인정보 설정을 관리합니다
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>
            계정 관련 설정을 확인하고 변경할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            프로필 정보는 프로필 편집 페이지에서 수정할 수 있습니다.
          </p>
          <Button variant="outline" onClick={() => router.push("/profile/edit")}>
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>개인정보</CardTitle>
          <CardDescription>
            개인정보 처리 및 데이터 관리
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • 임베딩 데이터는 개인정보로 취급되며, 본인 외에는 접근할 수 없습니다.
            </p>
            <p>
              • 비공개로 설정된 프로필 정보는 매칭에 사용되지 않습니다.
            </p>
            <p>
              • 프로필 조회 기록은 감사 목적으로 저장됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            위험 구역
          </CardTitle>
          <CardDescription>
            돌이킬 수 없는 작업입니다. 신중하게 진행해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              계정 삭제
            </Button>
          ) : (
            <div className="space-y-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <div className="text-sm text-destructive font-medium">
                정말로 계정을 삭제하시겠습니까?
              </div>
              <div className="text-sm text-muted-foreground">
                계정을 삭제하면 다음 데이터가 모두 영구 삭제됩니다:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>프로필 정보</li>
                  <li>관심사 태그</li>
                  <li>임베딩 데이터</li>
                  <li>매칭 선호도</li>
                  <li>조회 기록</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPhrase">
                  확인을 위해 <code className="bg-muted px-1 py-0.5 rounded">DELETE MY ACCOUNT</code>를 입력하세요
                </Label>
                <Input
                  id="confirmPhrase"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  disabled={deleting}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmPhrase("");
                    setError(null);
                  }}
                  disabled={deleting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmPhrase !== "DELETE MY ACCOUNT"}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    "계정 영구 삭제"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
