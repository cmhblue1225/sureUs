"use client";

/**
 * Custom Edge Component
 *
 * Enhanced edge rendering with:
 * - Gradient colors based on similarity
 * - Animated flow effect for strong connections
 * - Smooth hover transitions
 */

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { ClusteredEdge } from "@/lib/graph/clustering";

export interface CustomEdgeData
  extends Omit<ClusteredEdge, "id" | "source" | "target"> {
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

  const [isHovered, setIsHovered] = useState(false);

  // Calculate edge path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: connectionType === "cross_department" ? 0.25 : 0.15,
  });

  // 유사도 기반 그라데이션 색상
  const getStrokeColor = () => {
    if (isDimmed) return "rgba(156, 163, 175, 0.2)";
    if (isHighlighted || selected || isHovered) return "hsl(var(--primary))";

    // 유사도 기반 색상 (violet 계열)
    const hue = 250 + (1 - similarity) * 20; // violet -> blue
    const saturation = 50 + similarity * 30;
    const lightness = 50 + (1 - similarity) * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 유사도 기반 두께
  const getStrokeWidth = () => {
    if (isDimmed) return 1;
    if (isHovered || selected) return 3;

    if (similarity >= 0.7) return 3;
    if (similarity >= 0.5) return 2;
    return 1;
  };

  // 점선 스타일
  const getStrokeDasharray = () => {
    if (connectionType === "cross_department") return "6 4";
    return "none";
  };

  // 강한 연결 애니메이션
  const shouldAnimate = strengthLevel === "strong" && !isDimmed;

  // 투명도
  const getOpacity = () => {
    if (isDimmed) return 0.2;
    if (isHovered || selected) return 1;
    return 0.4 + similarity * 0.5;
  };

  return (
    <>
      {/* 호버 영역 확장을 위한 투명 엣지 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "pointer" }}
      />

      {/* 실제 엣지 */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: getStrokeColor(),
          strokeWidth: getStrokeWidth(),
          strokeDasharray: getStrokeDasharray(),
          opacity: getOpacity(),
          transition: "all 0.3s ease-out",
          strokeLinecap: "round",
        }}
        className={shouldAnimate ? "animate-pulse" : ""}
      />

      {/* 강한 연결 시 글로우 효과 */}
      {(strengthLevel === "strong" || isHovered) && !isDimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={getStrokeWidth() + 4}
          opacity={0.15}
          style={{
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Edge label - show on hover or when selected */}
      {(isHighlighted || selected || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              animation: "nodeEntrance 0.2s ease-out",
            }}
            className="px-2.5 py-1 rounded-lg glass-effect border border-white/20 shadow-lg"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-xs font-semibold"
                style={{
                  color: getStrokeColor(),
                }}
              >
                {Math.round(similarity * 100)}%
              </span>
              {mbtiCompatible && (
                <span
                  className="text-emerald-500 text-xs"
                  title="MBTI 궁합 좋음"
                >
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
