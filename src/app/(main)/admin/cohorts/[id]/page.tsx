"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import Link from "next/link";
import { CohortUserList } from "@/components/admin/CohortUserList";

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
}

export default function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 폼 상태
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchCohort() {
      try {
        const response = await fetch(`/api/admin/cohorts/${id}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "기수를 찾을 수 없습니다.");
        }

        setCohort(data.data);
        setName(data.data.name);
        setDescription(data.data.description || "");
        setIsActive(data.data.isActive);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCohort();
  }, [id]);

  async function handleSave() {
    if (!name.trim()) {
      alert("기수 이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/cohorts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isActive,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "저장에 실패했습니다.");
      }

      setCohort(data.data);
      alert("저장되었습니다.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <p className="text-destructive">{error || "기수를 찾을 수 없습니다."}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/cohorts")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link
          href="/admin/cohorts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          기수 목록
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          {cohort.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          기수 정보 수정 및 소속 사용자를 관리합니다.
        </p>
      </div>

      <div className="grid gap-6">
        {/* 기수 정보 편집 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기수 정보</CardTitle>
            <CardDescription>기수의 기본 정보를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  기수 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 공채 14기"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">활성 상태</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isActive ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="기수에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              소속 사용자 ({cohort.userCount}명)
            </CardTitle>
            <CardDescription>
              이 기수에 소속된 사용자를 관리합니다. 사용자를 선택하여 다른 기수로
              이동할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CohortUserList cohortId={id} cohortName={cohort.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
