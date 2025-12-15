"use client";

/**
 * Similarity Filter Slider Component
 *
 * Allows users to filter edges by minimum similarity threshold
 */

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SimilarityFilterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function SimilarityFilter({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
}: SimilarityFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">유사도 필터</Label>
        <span className="text-sm text-muted-foreground font-mono">
          {Math.round(value * 100)}%
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>약함</span>
        <span>강함</span>
      </div>
    </div>
  );
}
