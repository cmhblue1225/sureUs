"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

interface Cohort {
  id: string;
  name: string;
  userCount: number;
}

interface MoveUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  currentCohortId: string;
  currentCohortName: string;
  onSuccess: () => void;
}

export function MoveUserModal({
  open,
  onOpenChange,
  selectedUserIds,
  currentCohortId,
  currentCohortName,
  onSuccess,
}: MoveUserModalProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [targetCohortId, setTargetCohortId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCohorts();
    }
  }, [open]);

  async function fetchCohorts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/cohorts");
      const data = await response.json();

      if (data.success) {
        // 현재 기수 제외
        setCohorts(
          data.data.filter((c: Cohort) => c.id !== currentCohortId)
        );
      }
    } catch (err) {
      console.error("Failed to fetch cohorts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!targetCohortId) {
      setError("이동할 기수를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/cohorts/${targetCohortId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedUserIds }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "이동에 실패했습니다.");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setTargetCohortId("");
      setError(null);
    }
    onOpenChange(open);
  }

  const targetCohort = cohorts.find((c) => c.id === targetCohortId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사용자 기수 이동</DialogTitle>
          <DialogDescription>
            선택한 {selectedUserIds.length}명의 사용자를 다른 기수로 이동합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>현재 기수</Label>
            <p className="text-sm text-muted-foreground">{currentCohortName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-cohort">
              이동할 기수 <span className="text-destructive">*</span>
            </Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                로딩 중...
              </div>
            ) : cohorts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                이동 가능한 기수가 없습니다.
              </div>
            ) : (
              <Select
                value={targetCohortId}
                onValueChange={setTargetCohortId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="target-cohort">
                  <SelectValue placeholder="기수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name} ({cohort.userCount}명)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {targetCohort && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">이동 요약</p>
              <p className="text-muted-foreground mt-1">
                {selectedUserIds.length}명의 사용자가 &apos;{currentCohortName}&apos;에서
                &apos;{targetCohort.name}&apos;으로 이동합니다.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !targetCohortId || cohorts.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                이동 중...
              </>
            ) : (
              "이동"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MoveUserModal;
