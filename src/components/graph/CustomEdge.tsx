"use client";

/**
 * Custom Edge Component
 *
 * Enhanced edge rendering with:
 * - Different styles for same/cross department connections
 * - Thickness based on similarity strength
 * - Animation for high similarity connections
 * - Hover highlighting support
 */

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { ClusteredEdge } from "@/lib/graph/clustering";

export interface CustomEdgeData extends Omit<ClusteredEdge, "id" | "source" | "target"> {
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

type CustomEdgeProps = EdgeProps & {
  data?: CustomEdgeData;
};

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: CustomEdgeProps) {
  const {
    similarity = 0.5,
    connectionType = "same_department",
    strengthLevel = "moderate",
    mbtiCompatible = false,
    isHighlighted = false,
    isDimmed = false,
  } = data || {};

  // Calculate edge path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: connectionType === "cross_department" ? 0.3 : 0.1,
  });

  // Determine stroke style
  const getStrokeColor = () => {
    if (isDimmed) return "hsl(var(--muted-foreground) / 0.2)";
    if (isHighlighted || selected) return "hsl(var(--primary))";

    switch (connectionType) {
      case "cross_department":
        return "hsl(var(--primary) / 0.7)";
      case "same_department":
      default:
        return "hsl(var(--muted-foreground) / 0.5)";
    }
  };

  const getStrokeWidth = () => {
    if (isDimmed) return 1;

    switch (strengthLevel) {
      case "strong":
        return 3;
      case "moderate":
        return 2;
      case "weak":
      default:
        return 1;
    }
  };

  const getStrokeDasharray = () => {
    return connectionType === "cross_department" ? "5,5" : "none";
  };

  const shouldAnimate = strengthLevel === "strong" && !isDimmed;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: getStrokeColor(),
          strokeWidth: getStrokeWidth(),
          strokeDasharray: getStrokeDasharray(),
          opacity: isDimmed ? 0.3 : 1,
          transition: "all 0.2s ease",
        }}
        className={shouldAnimate ? "animate-pulse" : ""}
      />

      {/* Edge label - show on hover or when selected */}
      {(isHighlighted || selected) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="px-2 py-1 rounded bg-card border shadow-sm text-xs"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono">{Math.round(similarity * 100)}%</span>
              {mbtiCompatible && (
                <span className="text-green-500" title="MBTI 궁합 좋음">
                  ✓
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
