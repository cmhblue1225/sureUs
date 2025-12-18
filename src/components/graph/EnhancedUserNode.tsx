"use client";

/**
 * Enhanced User Node Component
 *
 * A React Flow node with hover highlighting support,
 * MBTI badge, department color coding, and search relevance effects
 */

import { memo, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { User, Sparkles } from "lucide-react";
import type { ClusteredNode } from "@/lib/graph/clustering";

export interface EnhancedUserNodeData extends ClusteredNode {
  isHighlighted?: boolean;
  isDimmed?: boolean;
  clusterColor?: string;
  onHover?: (nodeId: string | null) => void;
  // 검색 관련 props
  relevanceScore?: number;     // 0-1, 검색 관련도
  relevanceOpacity?: number;   // 0.15-1, 투명도
  hasActiveSearch?: boolean;   // 검색이 활성화되어 있는지
  matchedFields?: string[];    // 매칭된 필드들
  // 유사도 관련 props
  similarityScore?: number;    // 0-1, 유사도 점수
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
    isDimmed,
    clusterColor,
    onHover,
    id,
    // 검색/유사도 관련
    relevanceScore,
    relevanceOpacity,
    hasActiveSearch,
    matchedFields,
    similarityScore,
  } = data;

  const handleMouseEnter = () => {
    onHover?.(id);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  // 검색 활성화 시 관련도 기반 스타일 계산
  const searchStyles = useMemo(() => {
    if (!hasActiveSearch || isCurrentUser) {
      return {
        opacity: 1,
        scale: 1,
        boxShadow: undefined,
        isHighRelevance: false,
      };
    }

    const relevance = relevanceScore ?? 0;
    const opacity = relevanceOpacity ?? (relevance > 0 ? Math.max(0.3, relevance) : 0.15);
    const scale = 0.9 + relevance * 0.2; // 0.9 ~ 1.1

    // 높은 관련도 (0.5 이상)일 때 글로우 효과
    const isHighRelevance = relevance >= 0.5;
    const boxShadow = isHighRelevance
      ? `0 0 ${10 + relevance * 15}px rgba(139, 92, 246, ${0.3 + relevance * 0.3})`
      : undefined;

    return { opacity, scale, boxShadow, isHighRelevance };
  }, [hasActiveSearch, isCurrentUser, relevanceScore, relevanceOpacity]);

  // 유사도 점수 표시 (검색 없을 때)
  const showSimilarityBadge = !hasActiveSearch && similarityScore !== undefined && similarityScore > 0 && !isCurrentUser;
  const similarityPercent = showSimilarityBadge ? Math.round((similarityScore ?? 0) * 100) : 0;

  // 매칭된 필드 수
  const matchCount = matchedFields?.length ?? 0;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 shadow-sm bg-card
        ${isCurrentUser
          ? "border-primary bg-primary/10"
          : selected
            ? "border-primary/70 shadow-md"
            : "border-border hover:border-primary/50"
        }
        ${isDimmed && !hasActiveSearch ? "opacity-25" : ""}
        ${isHighlighted && !isCurrentUser ? "ring-2 ring-primary/30 shadow-md" : ""}
        ${searchStyles.isHighRelevance ? "ring-2 ring-violet-400/50" : ""}
      `}
      style={{
        minWidth: 140,
        borderLeftColor: clusterColor,
        borderLeftWidth: clusterColor ? 4 : 2,
        opacity: hasActiveSearch ? searchStyles.opacity : undefined,
        transform: hasActiveSearch ? `scale(${searchStyles.scale})` : undefined,
        boxShadow: searchStyles.boxShadow,
        transition: "opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.4s ease-out",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-2 !h-2"
      />

      {/* Node content */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{name}</p>
          {department && (
            <p className="text-xs text-muted-foreground truncate">{department}</p>
          )}
          {jobRole && (
            <p className="text-xs text-muted-foreground/70 truncate">{jobRole}</p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {isCurrentUser && (
          <Badge variant="default" className="text-xs">
            나
          </Badge>
        )}
        {mbti && (
          <Badge variant="secondary" className="text-xs font-mono">
            {mbti}
          </Badge>
        )}
        {/* 유사도 배지 (검색 없을 때) */}
        {showSimilarityBadge && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {similarityPercent}%
          </Badge>
        )}
        {/* 검색 매칭 표시 */}
        {hasActiveSearch && matchCount > 0 && (
          <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
            <Sparkles className="w-3 h-3 mr-1" />
            {matchCount}개 일치
          </Badge>
        )}
      </div>

      {/* 높은 관련도 표시 */}
      {hasActiveSearch && searchStyles.isHighRelevance && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

export const EnhancedUserNode = memo(EnhancedUserNodeComponent);
