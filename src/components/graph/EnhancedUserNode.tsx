"use client";

/**
 * Enhanced User Node Component
 *
 * A React Flow node with glassmorphism design,
 * smooth animations, and search relevance effects
 */

import { memo, useMemo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star } from "lucide-react";
import { DEFAULT_AVATAR_URL } from "@/components/ui/user-avatar";
import type { ClusteredNode } from "@/lib/graph/clustering";
import { findOrgHierarchyByName } from "@/lib/constants/organization";

export interface EnhancedUserNodeData extends ClusteredNode {
  isHighlighted?: boolean;
  isDimmed?: boolean;
  clusterColor?: string;
  onHover?: (nodeId: string | null) => void;
  // 검색 관련 props
  relevanceScore?: number;
  relevanceOpacity?: number;
  hasActiveSearch?: boolean;
  matchedFields?: string[];
  // 유사도 관련 props
  similarityScore?: number;
  // 애니메이션 props
  entranceDelay?: number;
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

interface EnhancedUserNodeProps {
  data: EnhancedUserNodeData;
  selected?: boolean;
}

function EnhancedUserNodeComponent({ data, selected }: EnhancedUserNodeProps) {
  const {
    name,
    department,
    jobRole,
    mbti,
    avatarUrl,
    isCurrentUser,
    isHighlighted,
    clusterColor,
    onHover,
    id,
    relevanceScore,
    hasActiveSearch,
    matchedFields,
    similarityScore,
    entranceDelay = 0,
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  // department에서 루트 레벨(연구소/센터/본부)만 추출
  const rootDepartment = useMemo(() => {
    if (!department) return undefined;

    // "A > B > C" 형식인 경우 첫 번째 부분 추출
    if (department.includes(" > ")) {
      return department.split(" > ")[0];
    }

    // 단일 이름인 경우 해당 조직의 상위 찾기
    const hierarchy = findOrgHierarchyByName(department);
    if (hierarchy) {
      return hierarchy.level1;
    }

    // 찾지 못한 경우 원본 반환
    return department;
  }, [department]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  // 검색 활성화 시 관련도 기반 스타일 계산
  const searchStyles = useMemo(() => {
    if (!hasActiveSearch || isCurrentUser) {
      return {
        glowClass: "",
        borderClass: "",
        scale: 1,
        relevanceLevel: "none" as const,
      };
    }

    const relevance = relevanceScore ?? 0;

    if (relevance >= 0.7) {
      return {
        glowClass: "relevance-glow-high",
        borderClass: "border-violet-500",
        scale: 1.08,
        relevanceLevel: "very-high" as const,
      };
    } else if (relevance >= 0.5) {
      return {
        glowClass: "relevance-glow-medium",
        borderClass: "border-violet-400",
        scale: 1.04,
        relevanceLevel: "high" as const,
      };
    } else if (relevance >= 0.3) {
      return {
        glowClass: "",
        borderClass: "border-violet-300",
        scale: 1,
        relevanceLevel: "medium" as const,
      };
    } else {
      return {
        glowClass: "",
        borderClass: "border-gray-300 dark:border-gray-600",
        scale: 0.95,
        relevanceLevel: "low" as const,
      };
    }
  }, [hasActiveSearch, isCurrentUser, relevanceScore]);

  // 유사도/관련도 퍼센트
  const showSimilarityBadge =
    !hasActiveSearch &&
    similarityScore !== undefined &&
    similarityScore > 0 &&
    !isCurrentUser;
  const similarityPercent = showSimilarityBadge
    ? Math.round((similarityScore ?? 0) * 100)
    : 0;

  const relevancePercent =
    hasActiveSearch && relevanceScore !== undefined
      ? Math.round(relevanceScore * 100)
      : null;

  const matchCount = matchedFields?.length ?? 0;

  // 현재 사용자 노드 특별 스타일
  const currentUserStyles = isCurrentUser
    ? "current-user-node border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
    : "";

  // 호버 시 스타일
  const hoverStyles = isHovered && !isCurrentUser ? "node-shadow-hover" : "node-shadow";

  return (
    <div
      className={`
        relative rounded-2xl glass-effect node-card
        ${currentUserStyles}
        ${!isCurrentUser ? hoverStyles : ""}
        ${hasActiveSearch && !isCurrentUser ? searchStyles.glowClass : ""}
        ${hasActiveSearch && !isCurrentUser ? searchStyles.borderClass : ""}
        ${!hasActiveSearch && !isCurrentUser ? "border border-white/20 dark:border-gray-700/50" : ""}
        ${isHighlighted && !isCurrentUser ? "ring-2 ring-primary/30" : ""}
        ${selected ? "ring-2 ring-primary" : ""}
      `}
      style={{
        minWidth: 160,
        borderTopWidth: isCurrentUser ? 2 : hasActiveSearch ? 3 : 1,
        borderRightWidth: isCurrentUser ? 2 : hasActiveSearch ? 3 : 1,
        borderBottomWidth: isCurrentUser ? 2 : hasActiveSearch ? 3 : 1,
        borderLeftWidth: clusterColor ? 4 : (isCurrentUser ? 2 : hasActiveSearch ? 3 : 1),
        borderLeftColor: clusterColor || undefined,
        transform: `scale(${hasActiveSearch && !isCurrentUser ? searchStyles.scale : 1})`,
        animation: entranceDelay > 0 ? `nodeEntrance 0.5s ease-out ${entranceDelay}ms both` : undefined,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-2 !border-muted-foreground/30 !w-3 !h-3 hover:!border-primary transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-2 !border-muted-foreground/30 !w-3 !h-3 hover:!border-primary transition-colors"
      />

      {/* Node content */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Avatar with gradient ring */}
          <div className="relative flex-shrink-0">
            <div
              className={`
                w-12 h-12 rounded-full p-[2px]
                ${isCurrentUser
                  ? "bg-gradient-to-br from-primary via-orange-400 to-amber-400"
                  : hasActiveSearch && searchStyles.relevanceLevel !== "none" && searchStyles.relevanceLevel !== "low"
                    ? "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500"
                    : "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
                }
              `}
            >
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <img
                  src={avatarUrl || DEFAULT_AVATAR_URL}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* 현재 사용자 표시 */}
            {isCurrentUser && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-foreground">{name}</p>
            {rootDepartment && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {rootDepartment}
              </p>
            )}
            {jobRole && (
              <p className="text-[11px] text-muted-foreground/70 truncate">
                {jobRole}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {mbti && (
            <Badge
              variant="secondary"
              className="text-[10px] font-mono px-1.5 py-0 h-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800"
            >
              {mbti}
            </Badge>
          )}
          {/* 유사도 배지 (검색 없을 때) */}
          {showSimilarityBadge && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 text-muted-foreground"
            >
              {similarityPercent}%
            </Badge>
          )}
          {/* 검색 관련도 배지 (검색 중일 때) */}
          {hasActiveSearch && !isCurrentUser && relevancePercent !== null && (
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-1.5 py-0 h-5 ${
                searchStyles.relevanceLevel === "very-high"
                  ? "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300"
                  : searchStyles.relevanceLevel === "high"
                    ? "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400"
                    : searchStyles.relevanceLevel === "medium"
                      ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
                      : "text-muted-foreground"
              }`}
            >
              {relevancePercent}%
            </Badge>
          )}
          {/* 검색 매칭 표시 */}
          {hasActiveSearch && matchCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/50 dark:to-purple-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {matchCount}
            </Badge>
          )}
        </div>

        {/* 호버 시 추가 정보 표시 */}
        {isHovered && matchedFields && matchedFields.length > 0 && (
          <div
            className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800"
            style={{
              animation: "nodeEntrance 0.2s ease-out",
            }}
          >
            <p className="text-[10px] text-violet-600 dark:text-violet-400 truncate">
              {matchedFields.slice(0, 3).join(", ")}
              {matchedFields.length > 3 && ` +${matchedFields.length - 3}`}
            </p>
          </div>
        )}
      </div>

      {/* 매우 높은 관련도 표시 - 스파클 아이콘 */}
      {hasActiveSearch &&
        (searchStyles.relevanceLevel === "very-high" ||
          searchStyles.relevanceLevel === "high") && (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef)",
              animation: "sparkle 1.5s ease-in-out infinite",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        )}
    </div>
  );
}

export const EnhancedUserNode = memo(EnhancedUserNodeComponent);
