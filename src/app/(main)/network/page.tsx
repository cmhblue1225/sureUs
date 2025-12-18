"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  Node,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import {
  EnhancedUserNode,
  ProfileModal,
  SemanticSearch,
  type EnhancedUserNodeData,
  type SemanticSearchResult,
  type SemanticSearchNode,
} from "@/components/graph";
import {
  calculateRadialPositions,
  calculateSearchBasedPositions,
  type NodeWithScore,
  type NodePosition,
} from "@/lib/graph/radialLayout";
import { easeOutCubic, lerpPosition } from "@/lib/graph/easing";
import type { ClusteredNode } from "@/lib/graph/clustering";

// Register custom node types
const nodeTypes = {
  enhancedUser: EnhancedUserNode,
};

// API 응답 타입
interface RadialNetworkNode {
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
  similarityScore: number;
}

interface RadialNetworkResult {
  nodes: RadialNetworkNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    similarity: number;
  }>;
  currentUserId: string;
  stats: {
    totalNodes: number;
    totalEdges: number;
    averageSimilarity: number;
  };
}

// SemanticSearchNode를 사용 (이미 relevanceScore, matchedFields 포함)

// 캔버스 크기 (노드 수에 따라 넓게)
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

// 레이아웃 옵션
const LAYOUT_OPTIONS = {
  minRadius: 180,
  maxRadius: 500,
  nodeSize: 200, // 노드 크기 + 여백 (겹침 방지)
};

// 검색 시 표시할 최소 관련도 임계값
const SEARCH_RELEVANCE_THRESHOLD = 0.3;

function NetworkPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkData, setNetworkData] = useState<RadialNetworkResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClusteredNode | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 검색 상태
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SemanticSearchNode[] | null>(null);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);

  // React Flow 상태
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const { fitView } = useReactFlow();

  // 애니메이션 레퍼런스
  const animationRef = useRef<{
    frameId: number | null;
    startTime: number | null;
    startPositions: Map<string, NodePosition>;
    targetPositions: Map<string, NodePosition>;
  }>({
    frameId: null,
    startTime: null,
    startPositions: new Map(),
    targetPositions: new Map(),
  });

  // 현재 노드 위치 추적
  const currentPositionsRef = useRef<Map<string, NodePosition>>(new Map());

  // 네트워크 데이터 fetch
  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/graph/network?layoutMode=radial&minSimilarity=0&maxNodes=100`
      );
      const data = await response.json();

      if (!data.success || !data.data) {
        setError(data.error || "네트워크 데이터를 불러올 수 없습니다.");
        return;
      }

      setNetworkData(data.data);
    } catch (err) {
      setError("네트워크를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  // 애니메이션 함수
  const animateToPositions = useCallback(
    (targetPositions: Map<string, NodePosition>, duration: number = 600) => {
      // 기존 애니메이션 취소
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }

      // 시작 위치 저장
      const startPositions = new Map<string, NodePosition>();
      nodes.forEach((node) => {
        startPositions.set(node.id, {
          x: currentPositionsRef.current.get(node.id)?.x ?? node.position.x,
          y: currentPositionsRef.current.get(node.id)?.y ?? node.position.y,
        });
      });

      animationRef.current.startPositions = startPositions;
      animationRef.current.targetPositions = targetPositions;
      animationRef.current.startTime = null;

      const animate = (timestamp: number) => {
        if (!animationRef.current.startTime) {
          animationRef.current.startTime = timestamp;
        }

        const elapsed = timestamp - animationRef.current.startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const start = animationRef.current.startPositions.get(node.id);
            const target = animationRef.current.targetPositions.get(node.id);

            if (!start || !target) return node;

            const newPosition = lerpPosition(start, target, easedProgress);
            currentPositionsRef.current.set(node.id, newPosition);

            return {
              ...node,
              position: newPosition,
            };
          })
        );

        if (progress < 1) {
          animationRef.current.frameId = requestAnimationFrame(animate);
        } else {
          animationRef.current.frameId = null;
        }
      };

      animationRef.current.frameId = requestAnimationFrame(animate);
    },
    [nodes, setNodes]
  );

  // 초기 방사형 레이아웃 계산 및 노드 생성
  useEffect(() => {
    if (!networkData) return;

    // 노드 점수 배열 생성
    const nodesWithScores: NodeWithScore[] = networkData.nodes.map((n) => ({
      id: n.id,
      similarityScore: n.similarityScore,
    }));

    // 방사형 위치 계산
    const positions = calculateRadialPositions(nodesWithScores, {
      centerX: CENTER_X,
      centerY: CENTER_Y,
      currentUserId: networkData.currentUserId,
      minRadius: LAYOUT_OPTIONS.minRadius,
      maxRadius: LAYOUT_OPTIONS.maxRadius,
      nodeSize: LAYOUT_OPTIONS.nodeSize,
    });

    // React Flow 노드 생성
    const flowNodes: Node[] = networkData.nodes.map((node) => {
      const pos = positions.get(node.id) || { x: CENTER_X, y: CENTER_Y };
      currentPositionsRef.current.set(node.id, pos);

      return {
        id: node.id,
        type: "enhancedUser",
        data: {
          id: node.id,
          userId: node.userId,
          name: node.name,
          department: node.department,
          jobRole: node.jobRole,
          officeLocation: node.officeLocation,
          mbti: node.mbti,
          avatarUrl: node.avatarUrl,
          hobbies: node.hobbies,
          isCurrentUser: node.isCurrentUser,
          similarityScore: node.similarityScore,
          hasActiveSearch: false,
        } as EnhancedUserNodeData,
        position: pos,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    setNodes(flowNodes);

    // 초기 fitView
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [networkData, setNodes, fitView]);

  // 검색 결과 처리
  const handleSearchResults = useCallback(
    (results: SemanticSearchResult | null) => {
      if (!results || !networkData) {
        // 검색 초기화
        setSearchResults(null);
        setHasActiveSearch(false);

        // 원래 방사형 위치로 복귀
        const nodesWithScores: NodeWithScore[] = networkData?.nodes.map((n) => ({
          id: n.id,
          similarityScore: n.similarityScore,
        })) || [];

        const positions = calculateRadialPositions(nodesWithScores, {
          centerX: CENTER_X,
          centerY: CENTER_Y,
          currentUserId: networkData?.currentUserId || "",
          minRadius: LAYOUT_OPTIONS.minRadius,
          maxRadius: LAYOUT_OPTIONS.maxRadius,
          nodeSize: LAYOUT_OPTIONS.nodeSize,
        });

        // 노드 데이터 업데이트 (검색 상태 해제, 모든 노드 표시)
        setNodes((prevNodes) =>
          prevNodes.map((node) => ({
            ...node,
            hidden: false, // 모든 노드 다시 표시
            data: {
              ...node.data,
              hasActiveSearch: false,
              relevanceScore: undefined,
              matchedFields: undefined,
            },
          }))
        );

        animateToPositions(positions);
        return;
      }

      setSearchResults(results.nodes);
      setHasActiveSearch(true);

      // 검색 결과 맵 생성
      const resultMap = new Map<string, SemanticSearchNode>();
      results.nodes.forEach((node) => {
        resultMap.set(node.id, node);
      });

      // 관련도가 임계값 이상인 노드만 필터링 (현재 사용자 + 관련 노드)
      const relevantNodes = results.nodes.filter(
        (n) => n.isCurrentUser || (n.relevanceScore ?? 0) >= SEARCH_RELEVANCE_THRESHOLD
      );

      // 관련 노드만 레이아웃 계산 (유사도순 정렬됨)
      const nodesWithRelevance: NodeWithScore[] = relevantNodes.map((n) => ({
        id: n.id,
        relevanceScore: n.relevanceScore,
        similarityScore: n.relevanceScore, // 검색 시에는 관련도 사용
      }));

      // 관련 노드만 방사형 배치
      const positions = calculateRadialPositions(nodesWithRelevance, {
        centerX: CENTER_X,
        centerY: CENTER_Y,
        currentUserId: results.currentUserId,
        minRadius: LAYOUT_OPTIONS.minRadius,
        maxRadius: LAYOUT_OPTIONS.maxRadius,
        nodeSize: LAYOUT_OPTIONS.nodeSize,
      });

      // 노드 데이터 업데이트 (관련 없는 노드는 숨김)
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const searchResult = resultMap.get(node.id);
          const relevanceScore = searchResult?.relevanceScore ?? 0;
          const isCurrentUser = (node.data as EnhancedUserNodeData).isCurrentUser;
          const isVisible = isCurrentUser || relevanceScore >= SEARCH_RELEVANCE_THRESHOLD;

          return {
            ...node,
            hidden: !isVisible, // 관련도 낮은 노드는 숨김
            data: {
              ...node.data,
              hasActiveSearch: true,
              relevanceScore,
              matchedFields: searchResult?.matchedFields,
            },
          };
        })
      );

      // 위치 애니메이션 (표시되는 노드만)
      animateToPositions(positions, 800);
    },
    [networkData, setNodes, animateToPositions]
  );

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    handleSearchResults(null);
  }, [handleSearchResults]);

  // 노드 클릭 핸들러
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = networkData?.nodes.find((n) => n.id === node.id);
      if (nodeData) {
        setSelectedNode({
          id: nodeData.id,
          userId: nodeData.userId,
          name: nodeData.name,
          department: nodeData.department,
          jobRole: nodeData.jobRole,
          officeLocation: nodeData.officeLocation,
          mbti: nodeData.mbti,
          avatarUrl: nodeData.avatarUrl,
          hobbies: nodeData.hobbies,
          isCurrentUser: nodeData.isCurrentUser,
          clusterId: "",
          position: node.position,
        });
        setIsProfileModalOpen(true);
      }
    },
    [networkData]
  );

  // 클린업
  useEffect(() => {
    return () => {
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }
    };
  }, []);

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
            나를 중심으로 동료들과의 관계를 탐색하세요
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">네트워크 그래프</h1>
          <p className="text-muted-foreground mt-1">
            나를 중심으로 동료들과의 관계를 탐색하세요
          </p>
        </div>
        <Button variant="outline" onClick={fetchNetwork} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* Main Area */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Graph */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="h-[700px]">
              <ReactFlow
                nodes={nodes}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    const data = node.data as unknown as EnhancedUserNodeData;
                    if (data?.isCurrentUser) return "hsl(var(--primary))";
                    if (hasActiveSearch && data?.relevanceScore) {
                      const opacity = 0.3 + (data.relevanceScore * 0.7);
                      return `rgba(139, 92, 246, ${opacity})`;
                    }
                    return "hsl(var(--muted))";
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">의미 검색</h3>
              </div>
              <SemanticSearch
                onSearchResults={handleSearchResults}
                isLoading={isSearching}
                setIsLoading={setIsSearching}
              />
              {hasActiveSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={handleClearSearch}
                >
                  <X className="w-4 h-4 mr-2" />
                  검색 초기화
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Search Results Info */}
          {hasActiveSearch && searchResults && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-3">검색 결과</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">표시 인원</span>
                    <span className="font-medium">
                      {searchResults.filter((n) => n.isCurrentUser || (n.relevanceScore ?? 0) >= SEARCH_RELEVANCE_THRESHOLD).length}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">전체 {searchResults.length}명 중 관련도 {Math.round(SEARCH_RELEVANCE_THRESHOLD * 100)}% 이상</span>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-muted-foreground">관련도 (거리로 표현)</p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span>높음 - 가까이</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-violet-300" />
                    <span>보통 - 중간</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-violet-100 border border-violet-200" />
                    <span>낮음 - 멀리</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Stats */}
          {networkData && !hasActiveSearch && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-3">네트워크 현황</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">전체 인원</span>
                    <span className="font-medium">{networkData.stats.totalNodes}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">평균 유사도</span>
                    <span className="font-medium font-mono">
                      {Math.round(networkData.stats.averageSimilarity * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3">범례</h3>
              <div className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">노드 위치 (중심에서의 거리)</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span>중앙: 나</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-card border-2 border-border" />
                  <span>가까움: 유사도 높음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-card border-2 border-border opacity-50" />
                  <span>멀리: 유사도 낮음</span>
                </div>
              </div>
            </CardContent>
          </Card>
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

export default function NetworkPage() {
  return (
    <ReactFlowProvider>
      <NetworkPageContent />
    </ReactFlowProvider>
  );
}
