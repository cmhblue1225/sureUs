"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOBBY_TAGS } from "@/lib/constants/hobbyTags";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
}

export function TagInput({ value, onChange, maxTags = 10, disabled }: TagInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag: string) => {
    if (value.length >= maxTags) return;
    if (value.includes(tag)) return;

    onChange([...value, tag]);
  };

  const handleRemoveTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const availableTags = HOBBY_TAGS.filter((tag) => !value.includes(tag));

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-background">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            아래에서 관심사를 선택하세요
          </span>
        ) : (
          value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Tag counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxTags} 선택됨
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowSuggestions(!showSuggestions)}
          disabled={disabled}
        >
          {showSuggestions ? "태그 숨기기" : "태그 보기"}
        </Button>
      </div>

      {/* Available tags */}
      {showSuggestions && (
        <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                disabled={disabled || value.length >= maxTags}
                className={cn(
                  "px-2.5 py-1 text-sm rounded-md border transition-colors",
                  value.length >= maxTags
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary hover:text-primary-foreground cursor-pointer"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
