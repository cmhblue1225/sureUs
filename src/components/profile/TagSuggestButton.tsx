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
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TagSuggestButtonProps {
  existingTags: string[];
  maxTags: number;
  onAddTags: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagSuggestButton({
  existingTags,
  maxTags,
  onAddTags,
  disabled = false,
  className,
}: TagSuggestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [reasoning, setReasoning] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = maxTags - existingTags.length;

  const fetchSuggestions = async () => {
    if (remainingSlots <= 0) {
      setError(`태그는 최대 ${maxTags}개까지 추가할 수 있습니다.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedTags([]);
    setSelectedTags(new Set());
    setReasoning("");

    try {
      const response = await fetch("/api/profile/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingTags,
          count: Math.min(5, remainingSlots),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "태그 추천에 실패했습니다.");
        return;
      }

      setSuggestedTags(data.data.tags);
      setReasoning(data.data.reasoning);
      setIsOpen(true);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        // Check if adding would exceed limit
        if (existingTags.length + next.size >= maxTags) {
          return prev;
        }
        next.add(tag);
      }
      return next;
    });
  };

  const handleApply = () => {
    const tagsToAdd = Array.from(selectedTags);
    if (tagsToAdd.length > 0) {
      onAddTags(tagsToAdd);
    }
    setIsOpen(false);
  };

  const handleRegenerate = async () => {
    await fetchSuggestions();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchSuggestions}
        disabled={disabled || isLoading || remainingSlots <= 0}
        className={cn("gap-1", className)}
        title="AI가 프로필에 맞는 태그를 추천합니다"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        AI 태그 추천
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 태그 추천
            </DialogTitle>
            <DialogDescription>
              프로필 정보를 바탕으로 추천된 태그입니다. 추가할 태그를 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {reasoning && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {reasoning}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const isSelected = selectedTags.has(tag);
                  const isExisting = existingTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => !isExisting && toggleTag(tag)}
                      disabled={isExisting}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors",
                        isExisting
                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>

              {selectedTags.size > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    선택된 태그 ({selectedTags.size}개)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedTags).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {remainingSlots - selectedTags.size}개 더 추가 가능
              </p>
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
              다시 추천
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
                disabled={selectedTags.size === 0}
              >
                {selectedTags.size}개 추가하기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
