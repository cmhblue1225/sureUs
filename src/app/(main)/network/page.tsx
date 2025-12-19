"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  Node,
  Position,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search, X, ChevronDown, ChevronUp, Users, SearchX, Star, Sparkles, Circle } from "lucide-react";
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
  runForceSimulation,
  runSearchBasedForceLayout,
  type ForceNode,
  type ForceLink,
  type NodePosition,
} from "@/lib/graph/forceLayout";
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

// 현재 사용자 노드 오프셋 (노드 카드 크기의 절반, React Flow는 좌상단 기준 배치)
// 노드 카드 크기: 약 180px x 110px → 중심 맞추려면 (-90, -55) 오프셋
const CURRENT_USER_OFFSET_X = -90;
const CURRENT_USER_OFFSET_Y = -55;

// Force 레이아웃 옵션
const FORCE_LAYOUT_OPTIONS = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  repulsion: -800,
  collisionRadius: 100,
  linkDistance: 200,
  linkStrength: 0.3,
  iterations: 150,
};

// 검색 시 표시할 최소 관련도 임계값
const SEARCH_RELEVANCE_THRESHOLD = 0.3;

// 티어별 결과 그룹화
interface GroupedResults {
  veryHigh: SemanticSearchNode[];  // 70%+
  high: SemanticSearchNode[];      // 50-69%
  medium: SemanticSearchNode[];    // 30-49%
}

const groupResultsByRelevance = (results: SemanticSearchNode[]): GroupedResults => {
  const filtered = results.filter((r) => !r.isCurrentUser);
  return {
    veryHigh: filtered.filter((r) => (r.relevanceScore ?? 0) >= 0.7),
    high: filtered.filter((r) => (r.relevanceScore ?? 0) >= 0.5 && (r.relevanceScore ?? 0) < 0.7),
    medium: filtered.filter((r) => (r.relevanceScore ?? 0) >= 0.3 && (r.relevanceScore ?? 0) < 0.5),
  };
};

// 티어 설정
type TierKey = 'veryHigh' | 'high' | 'medium';

const TIER_CONFIG: Record<TierKey, {
  title: string;
  icon: React.ReactNode;
  range: string;
  colorClass: string;
  badgeClass: string;
  dotClass: string;
}> = {
  veryHigh: {
    title: '최고 매칭',
    icon: <Star className="w-4 h-4" />,
    range: '70%+',
    colorClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
  high: {
    title: '높은 매칭',
    icon: <Sparkles className="w-4 h-4" />,
    range: '50-69%',
    colorClass: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
    dotClass: 'bg-purple-400',
  },
  medium: {
    title: '관련 있음',
    icon: <Circle className="w-4 h-4" />,
    range: '30-49%',
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    dotClass: 'bg-blue-400',
  },
};

// 검색 영역 경계 컴포넌트 - 뷰포트 변환 적용
// 반경은 forceLayout.ts의 공식과 일치: targetRadius = 100 + (1 - relevance) * 600
// 70% (0.7): 100 + 0.3 * 600 = 280px → 경계 300px
// 50% (0.5): 100 + 0.5 * 600 = 400px → 경계 450px
// 30% (0.3): 100 + 0.7 * 600 = 520px → 경계 600px
const ZONE_RADII = {
  veryHigh: 300,  // 70%+ 영역 경계
  high: 450,      // 50-69% 영역 경계
  medium: 600,    // 30-49% 영역 경계
};

function ZoneBoundaries({ centerX, centerY }: { centerX: number; centerY: number }) {
  const { x, y, zoom } = useViewport();

  return (
    <svg
      className="search-zones pointer-events-none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <g
        transform={`translate(${x}, ${y}) scale(${zoom})`}
        style={{ transformOrigin: '0 0' }}
      >
        {/* 관련 있음 (30-49%) - 파란색 외곽 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ZONE_RADII.medium}
          fill="rgba(96, 165, 250, 0.03)"
          stroke="rgb(96, 165, 250)"
          strokeWidth={1.5 / zoom}
          strokeDasharray="8 4"
        />
        {/* 높은 매칭 (50-69%) - 보라색 중간 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ZONE_RADII.high}
          fill="rgba(168, 85, 247, 0.04)"
          stroke="rgb(168, 85, 247)"
          strokeWidth={1.5 / zoom}
          strokeDasharray="8 4"
        />
        {/* 최고 매칭 (70%+) - 진한 보라색 내부 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ZONE_RADII.veryHigh}
          fill="rgba(139, 92, 246, 0.06)"
          stroke="rgb(139, 92, 246)"
          strokeWidth={2 / zoom}
        />
        {/* 영역 라벨 */}
        <text
          x={centerX}
          y={centerY - ZONE_RADII.veryHigh - 10}
          textAnchor="middle"
          fontSize={11 / zoom}
          className="fill-violet-600 dark:fill-violet-400"
          fontWeight="500"
        >
          최고 매칭 70%+
        </text>
        <text
          x={centerX}
          y={centerY - ZONE_RADII.high - 10}
          textAnchor="middle"
          fontSize={10 / zoom}
          className="fill-purple-500 dark:fill-purple-400"
        >
          높은 매칭 50-69%
        </text>
        <text
          x={centerX}
          y={centerY - ZONE_RADII.medium - 10}
          textAnchor="middle"
          fontSize={10 / zoom}
          className="fill-blue-500 dark:fill-blue-400"
        >
          관련 있음 30-49%
        </text>
      </g>
    </svg>
  );
}

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

  // 범례 접기 상태 (기본 접힘)
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(true);

  // 검색 결과 섹션 상태
  const [expandedSections, setExpandedSections] = useState<Record<TierKey, boolean>>({
    veryHigh: true,
    high: true,
    medium: false,
  });
  const [showAllInSection, setShowAllInSection] = useState<Record<TierKey, boolean>>({
    veryHigh: false,
    high: false,
    medium: false,
  });

  // 상태 전환 (낮은 우선순위 업데이트)
  const [isPending, startTransition] = useTransition();

  // 검색 결과 없음 상태
  const [noResultsFound, setNoResultsFound] = useState(false);

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

  // 애니메이션 함수 (stagger 지원)
  const animateToPositions = useCallback(
    (
      targetPositions: Map<string, NodePosition>,
      duration: number = 600,
      options?: { stagger?: boolean; staggerDelay?: number; nodeOrder?: string[] }
    ) => {
      // 기존 애니메이션 취소
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }

      const { stagger = false, staggerDelay = 50, nodeOrder = [] } = options || {};

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

      // stagger 시 각 노드별 시작 딜레이 계산
      const nodeDelays = new Map<string, number>();
      if (stagger && nodeOrder.length > 0) {
        nodeOrder.forEach((nodeId, index) => {
          nodeDelays.set(nodeId, index * staggerDelay);
        });
      }

      const animate = (timestamp: number) => {
        if (!animationRef.current.startTime) {
          animationRef.current.startTime = timestamp;
        }

        const elapsed = timestamp - animationRef.current.startTime;
        let allComplete = true;

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const start = animationRef.current.startPositions.get(node.id);
            const target = animationRef.current.targetPositions.get(node.id);

            if (!start || !target) return node;

            // stagger 딜레이 적용
            const delay = nodeDelays.get(node.id) || 0;
            const adjustedElapsed = Math.max(0, elapsed - delay);
            const progress = Math.min(adjustedElapsed / duration, 1);

            if (progress < 1) {
              allComplete = false;
            }

            const easedProgress = easeOutCubic(progress);
            const newPosition = lerpPosition(start, target, easedProgress);
            currentPositionsRef.current.set(node.id, newPosition);

            return {
              ...node,
              position: newPosition,
            };
          })
        );

        if (!allComplete) {
          animationRef.current.frameId = requestAnimationFrame(animate);
        } else {
          animationRef.current.frameId = null;
        }
      };

      animationRef.current.frameId = requestAnimationFrame(animate);
    },
    [nodes, setNodes]
  );

  // 초기 Force 레이아웃 계산 및 노드 생성
  useEffect(() => {
    if (!networkData) return;

    // Force 시뮬레이션용 노드 생성
    const forceNodes: ForceNode[] = networkData.nodes.map((n) => ({
      id: n.id,
      isCurrentUser: n.isCurrentUser,
      similarityScore: n.similarityScore,
    }));

    // Force 시뮬레이션용 링크 생성 (상위 유사도 연결만)
    const forceLinks: ForceLink[] = networkData.edges
      .filter((e) => e.similarity >= 0.3) // 유사도 30% 이상만 연결
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        similarity: e.similarity,
      }));

    // Force 시뮬레이션 실행
    const positions = runForceSimulation(forceNodes, forceLinks, FORCE_LAYOUT_OPTIONS);

    // React Flow 노드 생성
    const flowNodes: Node[] = networkData.nodes.map((node, index) => {
      // 현재 사용자는 무조건 정중앙에 배치 (오프셋 적용하여 노드 중심이 원 중심에 오도록)
      const pos = node.isCurrentUser
        ? { x: CENTER_X + CURRENT_USER_OFFSET_X, y: CENTER_Y + CURRENT_USER_OFFSET_Y }
        : (positions.get(node.id) || { x: CENTER_X, y: CENTER_Y });
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
          entranceDelay: index * 30, // 순차 등장 애니메이션용
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
        setNoResultsFound(false);

        // 원래 Force 레이아웃으로 복귀
        const forceNodes: ForceNode[] = networkData?.nodes.map((n) => ({
          id: n.id,
          isCurrentUser: n.isCurrentUser,
          similarityScore: n.similarityScore,
        })) || [];

        const forceLinks: ForceLink[] = networkData?.edges
          .filter((e) => e.similarity >= 0.3)
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            similarity: e.similarity,
          })) || [];

        const positions = runForceSimulation(forceNodes, forceLinks, FORCE_LAYOUT_OPTIONS);

        // 현재 사용자는 무조건 정중앙에 배치 (오프셋 적용)
        const currentUser = networkData?.nodes.find(n => n.isCurrentUser);
        if (currentUser) {
          positions.set(currentUser.id, {
            x: CENTER_X + CURRENT_USER_OFFSET_X,
            y: CENTER_Y + CURRENT_USER_OFFSET_Y
          });
        }

        // 노드 데이터 업데이트 (검색 상태 해제, 모든 노드 표시)
        startTransition(() => {
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
        });

        animateToPositions(positions);
        return;
      }

      // 검색 결과 맵 생성
      const resultMap = new Map<string, SemanticSearchNode>();
      results.nodes.forEach((node) => {
        resultMap.set(node.id, node);
      });

      // 관련도가 임계값 이상인 노드만 필터링 (현재 사용자 + 관련 노드)
      const relevantNodes = results.nodes.filter(
        (n) => n.isCurrentUser || (n.relevanceScore ?? 0) >= SEARCH_RELEVANCE_THRESHOLD
      );

      // 결과 없음 상태 확인 (현재 사용자 외에 관련 노드가 없는 경우)
      const hasRelevantResults = relevantNodes.filter((n) => !n.isCurrentUser).length > 0;
      setNoResultsFound(!hasRelevantResults);

      setSearchResults(results.nodes);
      setHasActiveSearch(true);

      // 관련 노드만 레이아웃 계산 (유사도순 정렬됨)
      const sortedRelevantNodes = [...relevantNodes].sort(
        (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
      );

      // Force 시뮬레이션용 노드 생성 (검색 결과 기반)
      const forceNodes: ForceNode[] = sortedRelevantNodes.map((n) => ({
        id: n.id,
        isCurrentUser: n.isCurrentUser,
        relevanceScore: n.relevanceScore,
        similarityScore: n.relevanceScore,
      }));

      // 검색 결과 기반 Force 레이아웃 실행
      const positions = runSearchBasedForceLayout(forceNodes, [], FORCE_LAYOUT_OPTIONS);

      // 현재 사용자는 무조건 정중앙에 배치 (오프셋 적용)
      const currentUserNode = sortedRelevantNodes.find(n => n.isCurrentUser);
      if (currentUserNode) {
        positions.set(currentUserNode.id, {
          x: CENTER_X + CURRENT_USER_OFFSET_X,
          y: CENTER_Y + CURRENT_USER_OFFSET_Y
        });
      }

      // 노드 데이터 업데이트 (관련 없는 노드는 숨김) - startTransition으로 우선순위 낮춤
      startTransition(() => {
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
      });

      // staggered 애니메이션 - 관련도 높은 순으로 노드 등장
      const nodeOrder = sortedRelevantNodes.map((n) => n.id);
      animateToPositions(positions, 600, {
        stagger: true,
        staggerDelay: 40,
        nodeOrder,
      });
    },
    [networkData, setNodes, animateToPositions, startTransition]
  );

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    handleSearchResults(null);
    // 섹션 상태 초기화
    setExpandedSections({ veryHigh: true, high: true, medium: false });
    setShowAllInSection({ veryHigh: false, high: false, medium: false });
  }, [handleSearchResults]);

  // 섹션 접기/펼치기 토글
  const toggleSection = useCallback((tier: TierKey) => {
    setExpandedSections((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }, []);

  // 더보기 토글
  const toggleShowAll = useCallback((tier: TierKey) => {
    setShowAllInSection((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }, []);

  // 검색 결과 그룹화 (memoized)
  const groupedResults = useMemo(() => {
    if (!searchResults) return null;
    return groupResultsByRelevance(searchResults);
  }, [searchResults]);

  // 총 검색 결과 수
  const totalVisibleResults = useMemo(() => {
    if (!groupedResults) return 0;
    return groupedResults.veryHigh.length + groupedResults.high.length + groupedResults.medium.length;
  }, [groupedResults]);

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
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="relative">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">네트워크 구성 중...</p>
          <p className="text-xs text-muted-foreground/70 mt-1">동료들의 연결 관계를 분석하고 있습니다</p>
        </div>
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
                {/* Zone Boundaries - 검색 활성화 시 유사도 영역 표시 */}
                {hasActiveSearch && !noResultsFound && (
                  <ZoneBoundaries centerX={CENTER_X} centerY={CENTER_Y} />
                )}
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

          {/* Search Loading Indicator */}
          {isSearching && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="relative">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500 absolute -bottom-1 -right-1" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">검색 중...</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">AI가 관련 동료를 찾고 있습니다</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Found */}
          {hasActiveSearch && noResultsFound && !isSearching && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex flex-col items-center justify-center py-4 gap-3">
                  <SearchX className="h-10 w-10 text-amber-500/70" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      검색 결과 없음
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                      관련도 {Math.round(SEARCH_RELEVANCE_THRESHOLD * 100)}% 이상인 동료가 없습니다
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                    onClick={handleClearSearch}
                  >
                    다른 검색어로 시도
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results - Tiered Sections */}
          {hasActiveSearch && searchResults && groupedResults && !noResultsFound && !isSearching && (
            <Card>
              <CardContent className="pt-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">검색 결과</h3>
                  <Badge variant="secondary" className="text-xs">
                    {totalVisibleResults}명
                  </Badge>
                </div>

                {/* Tiered Sections */}
                <div className="space-y-3">
                  {((['veryHigh', 'high', 'medium'] as TierKey[]).map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const results = groupedResults[tier];
                    const isExpanded = expandedSections[tier];
                    const showAll = showAllInSection[tier];
                    const displayCount = showAll ? results.length : 5;
                    const hasMore = results.length > 5;

                    if (results.length === 0) return null;

                    return (
                      <div key={tier} className="border rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(tier)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={config.colorClass}>
                              {config.icon}
                            </div>
                            <span className="text-sm font-medium">
                              {config.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({config.range})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                              {results.length}명
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Section Content */}
                        {isExpanded && (
                          <div className="border-t">
                            <div className="p-2 space-y-1">
                              {results
                                .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
                                .slice(0, displayCount)
                                .map((result) => {
                                  const score = Math.round((result.relevanceScore ?? 0) * 100);
                                  const node = nodes.find((n) => n.id === result.id);
                                  return (
                                    <button
                                      key={result.id}
                                      onClick={() => {
                                        if (node) {
                                          fitView({
                                            nodes: [{ id: node.id }],
                                            duration: 500,
                                            padding: 0.5,
                                          });
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                                    >
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotClass}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{result.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {result.department}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${config.badgeClass}`}>
                                        {score}%
                                      </Badge>
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Show More/Less Button */}
                            {hasMore && (
                              <button
                                onClick={() => toggleShowAll(tier)}
                                className="w-full text-xs text-muted-foreground hover:text-foreground py-2 border-t hover:bg-muted/30 transition-colors"
                              >
                                {showAll ? (
                                  <span>접기 ▲</span>
                                ) : (
                                  <span>+{results.length - 5}명 더보기 ▼</span>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }))}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">그래프에서 중심에 가까울수록 관련도가 높습니다</p>
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

          {/* Legend (Collapsible) */}
          <Card>
            <CardContent className="pt-4">
              <button
                onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <h3 className="font-medium">범례</h3>
                {isLegendCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {!isLegendCollapsed && (
                <div className="space-y-2 text-sm mt-3">
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
              )}
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
