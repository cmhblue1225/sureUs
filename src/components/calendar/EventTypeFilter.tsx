"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EventTypeFilterProps {
  value: "all" | "training" | "personal";
  onChange: (value: "all" | "training" | "personal") => void;
}

export function EventTypeFilter({ value, onChange }: EventTypeFilterProps) {
  const options = [
    { value: "all" as const, label: "전체" },
    { value: "training" as const, label: "교육 일정" },
    { value: "personal" as const, label: "개인 일정" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            value === option.value && "bg-primary text-primary-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
