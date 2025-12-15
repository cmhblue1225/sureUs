"use client";

/**
 * Graph Controls Component
 *
 * Unified control panel for graph interactions including:
 * - Similarity filter slider
 * - Cluster expand/collapse controls
 * - Legend display
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SimilarityFilter } from "./SimilarityFilter";
import { Expand, Minimize2, Info } from "lucide-react";
import type { ClusteringResult } from "@/lib/graph/clustering";

interface GraphControlsProps {
  stats: ClusteringResult["stats"];
  minSimilarity: number;
  onMinSimilarityChange: (value: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  clusterColors: { label: string; color: string }[];
}

export function GraphControls({
  stats,
  minSimilarity,
  onMinSimilarityChange,
  onExpandAll,
  onCollapseAll,
  clusterColors,
}: GraphControlsProps) {
  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            네트워크 통계
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 노드</span>
            <span className="font-medium">{stats.totalNodes}명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 연결</span>
            <span className="font-medium">{stats.totalEdges}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">클러스터</span>
            <span className="font-medium">{stats.clusterCount}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">평균 유사도</span>
            <span className="font-medium font-mono">
              {Math.round(stats.averageSimilarity * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filter Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">필터 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimilarityFilter
            value={minSimilarity}
            onChange={onMinSimilarityChange}
          />

          <Separator />

          {/* Cluster controls */}
          <div className="space-y-2">
            <p className="text-sm font-medium">클러스터 제어</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onExpandAll}
              >
                <Expand className="w-3 h-3 mr-1" />
                모두 펼치기
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onCollapseAll}
              >
                <Minimize2 className="w-3 h-3 mr-1" />
                모두 접기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">범례</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Node types */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">노드 유형</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary" />
              <span>나</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-card border-2 border-border" />
              <span>동료</span>
            </div>
          </div>

          <Separator />

          {/* Edge types */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">연결 유형</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-0.5 bg-muted-foreground/50" />
              <span>같은 부서</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-8 h-0.5 bg-primary/70"
                style={{ background: "repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 4px, transparent 4px, transparent 8px)" }}
              />
              <span>타 부서</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-1 bg-primary animate-pulse" />
              <span>높은 유사도</span>
            </div>
          </div>

          {/* Cluster colors */}
          {clusterColors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">부서 색상</p>
                <div className="grid grid-cols-2 gap-1">
                  {clusterColors.slice(0, 8).map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
