"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import type { EmployeeListItem } from "@/types/employee";

interface EmployeeDeleteDialogProps {
  employee: EmployeeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeDeleteDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: EmployeeDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!employee) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "삭제에 실패했습니다.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>직원 삭제</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>{employee?.name}</strong> ({employee?.email}) 직원을
              삭제하시겠습니까?
            </p>
            <p className="text-destructive">
              이 작업은 되돌릴 수 없으며, 해당 직원의 모든 데이터(프로필, 태그,
              임베딩 등)가 삭제됩니다.
            </p>
            {error && (
              <p className="p-2 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
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
  );
}

export default EmployeeDeleteDialog;
