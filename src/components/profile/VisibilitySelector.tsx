"use client";

import { Globe, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VisibilityLevel } from "@/types/database";

interface VisibilitySelectorProps {
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  disabled?: boolean;
}

const options = [
  {
    value: "public" as const,
    label: "전체 공개",
    icon: Globe,
    description: "모든 사용자에게 표시",
  },
  {
    value: "department" as const,
    label: "부서 내",
    icon: Users,
    description: "같은 부서에만 표시",
  },
  {
    value: "private" as const,
    label: "비공개",
    icon: Lock,
    description: "나만 볼 수 있음",
  },
];

export function VisibilitySelector({
  value,
  onChange,
  disabled,
}: VisibilitySelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent"
          )}
          title={option.description}
        >
          <option.icon className="h-3.5 w-3.5" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
