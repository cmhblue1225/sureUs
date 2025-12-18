"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CohortFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  mode?: "create" | "edit";
}

export function CohortForm({
  open,
  onOpenChange,
  onSubmit,
  initialName = "",
  initialDescription = "",
  mode = "create",
}: CohortFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("기수 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(name.trim(), description.trim());
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setName(initialName);
      setDescription(initialDescription);
      setError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "새 기수 생성" : "기수 수정"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "새로운 기수를 생성합니다. 기수 이름은 고유해야 합니다."
                : "기수 정보를 수정합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                기수 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 공채 14기"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 2025년 하반기 공채 신입사원"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : mode === "create" ? (
                "생성"
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CohortForm;
