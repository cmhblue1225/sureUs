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
import { Loader2, RefreshCw, User, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  EnhancedUserNode,
  CustomEdge,
  GraphControls,
  type EnhancedUserNodeData,
  type CustomEdgeData,
} from "@/components/graph";
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
      const response = await fetch(
        `/api/graph/network?minSimilarity=${minSimilarity}&width=800&height=600`
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
  }, [minSimilarity]);

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

  // Node click handler
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const clusteredNode = clusteringResult?.nodes.find((n) => n.id === node.id);
      if (clusteredNode) {
        setSelectedNode(clusteredNode);
        setSelectedEdge(null);
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
    setSelectedNode(null);
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

          {/* Selected Node Info */}
          {selectedNode && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedNode.avatarUrl ? (
                      <img
                        src={selectedNode.avatarUrl}
                        alt={selectedNode.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedNode.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedNode.department}
                    </p>
                  </div>
                </div>

                {selectedNode.jobRole && (
                  <p className="text-sm mb-2">{selectedNode.jobRole}</p>
                )}

                {selectedNode.officeLocation && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedNode.officeLocation}
                  </p>
                )}

                {/* MBTI & Hobbies */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {selectedNode.mbti && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {selectedNode.mbti}
                    </Badge>
                  )}
                  {selectedNode.hobbies.slice(0, 3).map((hobby) => (
                    <Badge key={hobby} variant="outline" className="text-xs">
                      {hobby}
                    </Badge>
                  ))}
                </div>

                {!selectedNode.isCurrentUser && (
                  <div className="flex gap-2">
                    <Link href={`/profile/${selectedNode.userId}`} className="flex-1">
                      <Button className="w-full" variant="outline" size="sm">
                        프로필 보기
                      </Button>
                    </Link>
                    <Link href={`/messages?to=${selectedNode.userId}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        메시지
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
    </div>
  );
}
