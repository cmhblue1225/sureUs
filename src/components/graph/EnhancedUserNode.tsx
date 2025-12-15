"use client";

/**
 * Enhanced User Node Component
 *
 * A React Flow node with hover highlighting support,
 * MBTI badge, and department color coding
 */

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { ClusteredNode } from "@/lib/graph/clustering";

export interface EnhancedUserNodeData extends ClusteredNode {
  isHighlighted?: boolean;
  isDimmed?: boolean;
  clusterColor?: string;
  onHover?: (nodeId: string | null) => void;
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
  } = data;

  const handleMouseEnter = () => {
    onHover?.(id);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 shadow-sm bg-card transition-all duration-200
        ${isCurrentUser
          ? "border-primary bg-primary/10"
          : selected
            ? "border-primary/70 shadow-md"
            : "border-border hover:border-primary/50"
        }
        ${isDimmed ? "opacity-25" : "opacity-100"}
        ${isHighlighted && !isCurrentUser ? "ring-2 ring-primary/30 shadow-md" : ""}
      `}
      style={{
        minWidth: 140,
        borderLeftColor: clusterColor,
        borderLeftWidth: clusterColor ? 4 : 2,
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
      </div>
    </div>
  );
}

export const EnhancedUserNode = memo(EnhancedUserNodeComponent);
