"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProfileFieldType =
  | "collaborationStyle"
  | "strengths"
  | "preferredPeopleType"
  | "workDescription"
  | "careerGoals";

interface LLMAssistButtonProps {
  fieldType: ProfileFieldType;
  onSuggestion: (text: string) => void;
  disabled?: boolean;
  className?: string;
  additionalContext?: Record<string, string | undefined>;
}

const FIELD_LABELS: Record<ProfileFieldType, string> = {
  collaborationStyle: "협업 스타일",
  strengths: "장점/강점",
  preferredPeopleType: "선호하는 동료 유형",
  workDescription: "부서에서 하는 일",
  careerGoals: "커리어 목표",
};

export function LLMAssistButton({
  fieldType,
  onSuggestion,
  disabled = false,
  className,
  additionalContext,
}: LLMAssistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setAlternatives([]);
    setSelectedIndex(0);

    try {
      const response = await fetch("/api/profile/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldType,
          additionalContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "텍스트 생성에 실패했습니다.");
        return;
      }

      setSuggestion(data.data.suggestion);
      setAlternatives(data.data.alternatives || []);
      setIsOpen(true);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const allOptions = suggestion ? [suggestion, ...alternatives] : alternatives;
    const selectedText = allOptions[selectedIndex];
    if (selectedText) {
      onSuggestion(selectedText);
    }
    setIsOpen(false);
  };

  const handleRegenerate = async () => {
    await fetchSuggestion();
  };

  const allOptions = suggestion ? [suggestion, ...alternatives] : alternatives;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={fetchSuggestion}
        disabled={disabled || isLoading}
        className={cn("h-7 gap-1 text-xs text-muted-foreground hover:text-primary", className)}
        title={`AI가 ${FIELD_LABELS[fieldType]} 작성을 도와드립니다`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        AI 도움
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {FIELD_LABELS[fieldType]} 작성 도움
            </DialogTitle>
            <DialogDescription>
              AI가 제안한 내용을 확인하고, 마음에 드는 것을 선택해주세요.
              적용 후 직접 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {allOptions.map((text, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedIndex === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                        selectedIndex === index
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selectedIndex === index && <Check className="h-3 w-3" />}
                    </div>
                    <p className="text-sm leading-relaxed">{text}</p>
                  </div>
                  {index === 0 && (
                    <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      추천
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              다시 생성
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!suggestion && alternatives.length === 0}
              >
                적용하기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
