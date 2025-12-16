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

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Controls */}
          {clusteringResult && (
            <GraphControls
              stats={clusteringResult.stats}
              minSimilarity={minSimilarity}
              onMinSimilarityChange={setMinSimilarity}
              onExpandAll={interaction.expandAllClusters}
              onCollapseAll={interaction.collapseAllClusters}
              clusterColors={clusterColors}
            />
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

      {/* Profile Modal */}
      <ProfileModal
        node={selectedNode}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </div>
  );
}
