"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  EnhancedUserNode,
  CustomEdge,
  GraphControls,
  ProfileModal,
  SemanticSearch,
  type EnhancedUserNodeData,
  type CustomEdgeData,
} from "@/components/graph";
import { KeywordFilter } from "@/components/graph/KeywordFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGraphInteraction } from "@/hooks/useGraphInteraction";
import type {
  ClusteringResult,
  ClusteredNode,
  ClusteredEdge,
  ClusterDefinition,
} from "@/lib/graph/clustering";

// Register custom node and edge types
const nodeTypes = {
  enhancedUser: EnhancedUserNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface APIResponse {
  success: boolean;
  error?: string;
  data?: ClusteringResult;
}

export default function NetworkPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(0.2);
  const [selectedNode, setSelectedNode] = useState<ClusteredNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ClusteredEdge | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 키워드 필터 상태
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"any" | "all">("any");

  // 의미 검색 상태
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const [semanticResults, setSemanticResults] = useState<{
    nodes: Array<{
      id: string;
      userId: string;
      name: string;
      department: string;
      jobRole: string;
      officeLocation: string;
      mbti?: string;
      avatarUrl?: string;
      hobbies: string[];
      isCurrentUser: boolean;
      clusterId: string;
      position: { x: number; y: number };
      matchScore?: number;
      matchReasons?: string[];
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      similarity: number;
      commonTags: string[];
      connectionType: string;
      strengthLevel: string;
      mbtiCompatible: boolean;
    }>;
  } | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Graph interaction hook
  const interaction = useGraphInteraction(
    clusteringResult?.edges || [],
    clusteringResult?.clusters || []
  );

  // Fetch network data
  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 키워드 파라미터 추가
      const keywordsParam = selectedTags.length > 0
        ? `&keywords=${encodeURIComponent(selectedTags.join(","))}&filterMode=${filterMode}`
        : "";

      const response = await fetch(
        `/api/graph/network?minSimilarity=${minSimilarity}&width=800&height=600${keywordsParam}`
      );
      const data: APIResponse = await response.json();

      if (!data.success || !data.data) {
        setError(data.error || "네트워크 데이터를 불러올 수 없습니다.");
        return;
      }

      setClusteringResult(data.data);
    } catch (err) {
      setError("네트워크를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [minSimilarity, selectedTags, filterMode]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  // Convert clustering result to React Flow format
  useEffect(() => {
    if (!clusteringResult) return;

    // Build cluster color map
    const clusterColorMap = new Map<string, string>();
    clusteringResult.clusters.forEach((c) => {
      clusterColorMap.set(c.id, c.color);
    });

    // Convert nodes
    const flowNodes: Node[] = clusteringResult.nodes.map((node) => ({
      id: node.id,
      type: "enhancedUser",
      data: {
        ...node,
        isHighlighted: interaction.isNodeHighlighted(node.id),
        isDimmed: interaction.isNodeDimmed(node.id),
        clusterColor: clusterColorMap.get(node.clusterId),
        onHover: interaction.onNodeHover,
      },
      position: node.position,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    // Filter edges by similarity
    const filteredEdges = clusteringResult.edges.filter(
      (e) => e.similarity >= minSimilarity
    );

    // Convert edges
    const flowEdges: Edge[] = filteredEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "custom",
      data: {
        similarity: edge.similarity,
        commonTags: edge.commonTags,
        connectionType: edge.connectionType,
        strengthLevel: edge.strengthLevel,
        mbtiCompatible: edge.mbtiCompatible,
        isHighlighted: interaction.isEdgeHighlighted(edge.id),
        isDimmed: interaction.isEdgeDimmed(edge.id),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [
    clusteringResult,
    minSimilarity,
    interaction.hoveredNodeId,
    interaction.selectedNodeId,
    setNodes,
    setEdges,
  ]);

  // Node click handler - opens profile modal
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const clusteredNode = clusteringResult?.nodes.find((n) => n.id === node.id);
      if (clusteredNode) {
        setSelectedNode(clusteredNode);
        setSelectedEdge(null);
        setIsProfileModalOpen(true);
        interaction.onNodeSelect(node.id);
      }
    },
    [clusteringResult, interaction]
  );

  // Edge click handler
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const clusteredEdge = clusteringResult?.edges.find((e) => e.id === edge.id);
      if (clusteredEdge) {
        setSelectedEdge(clusteredEdge);
        setSelectedNode(null);
        interaction.onEdgeSelect(edge.id);
      }
    },
    [clusteringResult, interaction]
  );

  // Pane click handler
  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
    interaction.resetSelection();
  }, [interaction]);

  // Cluster colors for legend
  const clusterColors = useMemo(() => {
    if (!clusteringResult) return [];
    return clusteringResult.clusters.map((c) => ({
      label: c.label,
      color: c.color,
    }));
  }, [clusteringResult]);

  // 의미 검색 결과를 그래프에 반영
  useEffect(() => {
    if (searchMode !== "semantic" || !semanticResults) return;

    // 의미 검색 결과를 Flow 노드/엣지로 변환
    const flowNodes: Node[] = semanticResults.nodes.map((node) => ({
      id: node.id,
      type: "enhancedUser",
      data: {
        ...node,
        isHighlighted: interaction.isNodeHighlighted(node.id),
        isDimmed: interaction.isNodeDimmed(node.id),
        clusterColor: "#8B5CF6", // 의미 검색용 보라색
        onHover: interaction.onNodeHover,
      },
      position: node.position,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const flowEdges: Edge[] = semanticResults.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "custom",
      data: {
        similarity: edge.similarity,
        commonTags: edge.commonTags,
        connectionType: edge.connectionType,
        strengthLevel: edge.strengthLevel,
        mbtiCompatible: edge.mbtiCompatible,
        isHighlighted: interaction.isEdgeHighlighted(edge.id),
        isDimmed: interaction.isEdgeDimmed(edge.id),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [searchMode, semanticResults, interaction.hoveredNodeId, interaction.selectedNodeId, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">네트워크 그래프</h1>
          <p className="text-muted-foreground mt-1">
            나와 연결된 동료들의 관계를 시각적으로 탐색하세요
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            {error.includes("프로필") && (
              <Link href="/profile/edit">
                <Button>프로필 작성하기</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">네트워크 그래프</h1>
          <p className="text-muted-foreground mt-1">
            나와 연결된 동료들의 관계를 시각적으로 탐색하세요
          </p>
        </div>
        <Button variant="outline" onClick={fetchNetwork} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* Main Area: Graph + Right Sidebar */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Graph */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="h-[600px]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={2}
                defaultEdgeOptions={{
                  type: "custom",
                }}
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    const data = node.data as unknown as EnhancedUserNodeData;
                    return data?.isCurrentUser
                      ? "hsl(var(--primary))"
                      : data?.clusterColor || "hsl(var(--muted))";
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Filter + Search */}
        <div className="space-y-4">
          {/* Filter Controls */}
          {clusteringResult && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">유사도 필터</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">최소 유사도</span>
                      <span className="font-mono font-medium">{Math.round(minSimilarity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={minSimilarity * 100}
                      onChange={(e) => setMinSimilarity(Number(e.target.value) / 100)}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={interaction.expandAllClusters}
                  >
                    모두 펼치기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={interaction.collapseAllClusters}
                  >
                    모두 접기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Tabs */}
          <Card>
            <CardContent className="pt-4">
              <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "keyword" | "semantic")}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="keyword" className="flex-1">키워드</TabsTrigger>
                  <TabsTrigger value="semantic" className="flex-1">의미검색</TabsTrigger>
                </TabsList>
                <TabsContent value="keyword" className="mt-0">
                  <KeywordFilter
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    filterMode={filterMode}
                    onFilterModeChange={setFilterMode}
                  />
                </TabsContent>
                <TabsContent value="semantic" className="mt-0">
                  <SemanticSearch
                    onSearchResults={setSemanticResults}
                    isLoading={semanticLoading}
                    setIsLoading={setSemanticLoading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected Edge Info */}
          {selectedEdge && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">연결 정보</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">유사도</span>
                    <span className="font-mono font-medium">
                      {Math.round(selectedEdge.similarity * 100)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">연결 유형</span>
                    <Badge variant={selectedEdge.connectionType === "cross_department" ? "default" : "secondary"}>
                      {selectedEdge.connectionType === "cross_department" ? "타부서" : "같은 부서"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">강도</span>
                    <Badge
                      variant={
                        selectedEdge.strengthLevel === "strong"
                          ? "default"
                          : selectedEdge.strengthLevel === "moderate"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {selectedEdge.strengthLevel === "strong"
                        ? "강함"
                        : selectedEdge.strengthLevel === "moderate"
                          ? "보통"
                          : "약함"}
                    </Badge>
                  </div>

                  {selectedEdge.mbtiCompatible && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MBTI 궁합</span>
                      <span className="text-green-600">좋음</span>
                    </div>
                  )}

                  {selectedEdge.commonTags.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2">공통 관심사:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedEdge.commonTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Row: Stats + Legend */}
      {clusteringResult && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Network Stats */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium mb-3">네트워크 통계</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 노드</span>
                  <span className="font-medium">{clusteringResult.stats.totalNodes}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 연결</span>
                  <span className="font-medium">{clusteringResult.stats.totalEdges}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">클러스터</span>
                  <span className="font-medium">{clusteringResult.stats.clusterCount}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">평균 유사도</span>
                  <span className="font-medium font-mono">
                    {Math.round(clusteringResult.stats.averageSimilarity * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend - Node Types */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium mb-3">범례</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">노드 유형</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary" />
                    <span>나</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-card border-2 border-border" />
                    <span>동료</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">연결 유형</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-muted-foreground/50" />
                    <span>같은 부서</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-primary/70" style={{ background: "repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 3px, transparent 3px, transparent 6px)" }} />
                    <span>타 부서</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cluster Colors */}
          {clusterColors.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-sm font-medium mb-3">부서 색상</h3>
                <div className="grid grid-cols-3 gap-2">
                  {clusterColors.slice(0, 9).map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        node={selectedNode}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </div>
  );
}
