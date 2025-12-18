"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users } from "lucide-react";
import { CohortCard } from "@/components/admin/CohortCard";
import { CohortForm } from "@/components/admin/CohortForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export default function CohortsPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCohorts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/cohorts");
      const data = await response.json();

      if (data.success) {
        setCohorts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch cohorts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  async function handleCreateCohort(name: string, description: string) {
    const response = await fetch("/api/admin/cohorts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "기수 생성에 실패했습니다.");
    }

    fetchCohorts();
  }

  async function handleSelectCohort(cohortId: string) {
    setIsSelecting(true);
    try {
      const response = await fetch("/api/admin/cohorts/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        alert(data.error || "기수 선택에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to select cohort:", error);
      alert("기수 선택에 실패했습니다.");
    } finally {
      setIsSelecting(false);
    }
  }

  function handleDeleteClick(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/cohorts/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "기수 삭제에 실패했습니다.");
      }

      fetchCohorts();
    } catch (error) {
      console.error("Failed to delete cohort:", error);
      alert(
        error instanceof Error ? error.message : "기수 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            기수 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            기수를 선택하여 해당 기수의 데이터를 관리합니다.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          새 기수 생성
        </Button>
      </div>

      {cohorts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>등록된 기수가 없습니다.</p>
          <p className="text-sm mt-2">새 기수를 생성해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohorts.map((cohort) => (
            <CohortCard
              key={cohort.id}
              id={cohort.id}
              name={cohort.name}
              description={cohort.description}
              userCount={cohort.userCount}
              isActive={cohort.isActive}
              onSelect={handleSelectCohort}
              onDelete={handleDeleteClick}
              isSelecting={isSelecting}
            />
          ))}
        </div>
      )}

      {/* 기수 생성 폼 */}
      <CohortForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateCohort}
        mode="create"
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기수 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{deleteTarget?.name}&apos; 기수를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
