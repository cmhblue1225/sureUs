"use client";

/**
 * Cluster Node Component
 *
 * Represents a collapsed cluster showing department name and member count
 * Click to expand and show individual members
 */

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import type { ClusterDefinition } from "@/lib/graph/clustering";

export interface ClusterNodeData extends ClusterDefinition {
  isExpanded: boolean;
  onToggle?: (clusterId: string) => void;
}

interface ClusterNodeProps {
  data: ClusterNodeData;
  selected?: boolean;
}

function ClusterNodeComponent({ data, selected }: ClusterNodeProps) {
  const { id, label, color, memberIds, isExpanded, onToggle } = data;

  const handleClick = () => {
    onToggle?.(id);
  };

  return (
    <div
      className={`
        relative rounded-xl border-2 shadow-md bg-card cursor-pointer
        transition-all duration-200 hover:shadow-lg
        ${selected ? "ring-2 ring-primary/30" : ""}
      `}
      style={{
        minWidth: 120,
        borderColor: color,
        backgroundColor: `${color}10`,
      }}
      onClick={handleClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3"
      />

      {/* Cluster content */}
      <div className="p-4 text-center">
        {/* Icon */}
        <div
          className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Users className="w-6 h-6" style={{ color }} />
        </div>

        {/* Label */}
        <p className="font-semibold text-sm mb-1">{label}</p>

        {/* Member count */}
        <p className="text-xs text-muted-foreground">
          {memberIds.length}명
        </p>

        {/* Expand indicator */}
        <div className="mt-2 flex items-center justify-center text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span className="text-xs ml-1">
            {isExpanded ? "접기" : "펼치기"}
          </span>
        </div>
      </div>
    </div>
  );
}

export const ClusterNode = memo(ClusterNodeComponent);
