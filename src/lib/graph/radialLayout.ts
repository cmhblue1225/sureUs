/**
 * 방사형 레이아웃 알고리즘
 * - 중심 사용자 기준 유사도/관련도에 따른 위치 계산
 * - 노드 수에 따른 동적 반경 계산으로 겹침 방지
 */

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeWithScore {
  id: string;
  similarityScore?: number; // 0-1, 높을수록 유사
  relevanceScore?: number;  // 0-1, 검색 관련도
}

export interface RadialLayoutOptions {
  centerX: number;
  centerY: number;
  currentUserId: string;
  minRadius: number;  // 가장 가까운 노드 거리 (기본 200)
  maxRadius: number;  // 가장 먼 노드 거리 (기본 600)
  startAngle?: number; // 시작 각도 (라디안, 기본 0)
  nodeSize?: number;  // 노드 크기 (겹침 방지용, 기본 180)
}

/**
 * 유사도를 반경으로 변환
 * 유사도가 높을수록 중심에 가깝게 배치
 */
function similarityToRadius(
  similarity: number,
  minRadius: number,
  maxRadius: number
): number {
  // 지수 매핑으로 유사도 높은 노드들을 더 가깝게
  const normalized = Math.pow(similarity, 0.7);
  return maxRadius - normalized * (maxRadius - minRadius);
}

/**
 * 황금 각도를 사용한 균등 분포
 * 노드들이 겹치지 않고 균등하게 배치됨
 */
function getGoldenAngle(index: number, startAngle: number = 0): number {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5도
  return startAngle + index * goldenAngle;
}

/**
 * 링(ring) 기반 방사형 배치 계산
 * 노드 수에 따라 여러 개의 동심원에 균등하게 배치
 */
function calculateRingLayout(
  nodeCount: number,
  minRadius: number,
  maxRadius: number,
  nodeSize: number
): { radius: number; count: number }[] {
  if (nodeCount === 0) return [];

  const rings: { radius: number; count: number }[] = [];
  let remainingNodes = nodeCount;
  let currentRadius = minRadius;

  while (remainingNodes > 0 && currentRadius <= maxRadius) {
    // 이 반경에서 겹치지 않게 배치할 수 있는 최대 노드 수
    const circumference = 2 * Math.PI * currentRadius;
    const maxNodesAtRadius = Math.max(1, Math.floor(circumference / nodeSize));

    // 남은 노드와 최대 노드 수 중 작은 값
    const nodesInRing = Math.min(remainingNodes, maxNodesAtRadius);

    rings.push({ radius: currentRadius, count: nodesInRing });
    remainingNodes -= nodesInRing;

    // 다음 링으로 이동 (노드 크기만큼 간격)
    currentRadius += nodeSize * 0.9;
  }

  // 남은 노드가 있으면 마지막 링에 추가
  if (remainingNodes > 0 && rings.length > 0) {
    rings[rings.length - 1].count += remainingNodes;
  }

  return rings;
}

/**
 * 유사도 기반 방사형 배치 계산
 * 현재 사용자를 중심에 두고 유사도에 따라 방사형으로 배치
 * 링 기반 레이아웃으로 노드 겹침 방지
 */
export function calculateRadialPositions(
  nodes: NodeWithScore[],
  options: RadialLayoutOptions
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const {
    centerX,
    centerY,
    currentUserId,
    minRadius,
    maxRadius,
    startAngle = 0,
    nodeSize = 180,
  } = options;

  // 현재 사용자는 중앙에 배치
  positions.set(currentUserId, { x: centerX, y: centerY });

  // 다른 노드들을 유사도순으로 정렬
  const otherNodes = nodes
    .filter((n) => n.id !== currentUserId)
    .sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0));

  if (otherNodes.length === 0) return positions;

  // 링 레이아웃 계산
  const rings = calculateRingLayout(otherNodes.length, minRadius, maxRadius, nodeSize);

  // 각 노드를 링에 배치
  let nodeIndex = 0;
  rings.forEach((ring, ringIndex) => {
    const ringStartAngle = startAngle + (ringIndex * Math.PI / 6); // 각 링마다 약간 회전

    for (let i = 0; i < ring.count && nodeIndex < otherNodes.length; i++) {
      const node = otherNodes[nodeIndex];
      const angle = ringStartAngle + (2 * Math.PI * i) / ring.count;

      positions.set(node.id, {
        x: centerX + ring.radius * Math.cos(angle),
        y: centerY + ring.radius * Math.sin(angle),
      });

      nodeIndex++;
    }
  });

  return positions;
}

/**
 * 검색 결과 기반 위치 재계산
 * 관련도에 따라 노드들을 재배치 (링 기반 레이아웃)
 */
export function calculateSearchBasedPositions(
  nodes: NodeWithScore[],
  options: RadialLayoutOptions
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const {
    centerX,
    centerY,
    currentUserId,
    minRadius,
    maxRadius,
    startAngle = 0,
    nodeSize = 180,
  } = options;

  // 현재 사용자는 중앙에 유지
  positions.set(currentUserId, { x: centerX, y: centerY });

  // 다른 노드들을 관련도순으로 정렬
  const otherNodes = nodes
    .filter((n) => n.id !== currentUserId)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  // 관련도가 있는 노드와 없는 노드 분리
  const relevantNodes = otherNodes.filter((n) => (n.relevanceScore ?? 0) > 0);
  const irrelevantNodes = otherNodes.filter((n) => (n.relevanceScore ?? 0) === 0);

  // 관련 노드들: 가까운 링에 배치
  if (relevantNodes.length > 0) {
    const innerRings = calculateRingLayout(
      relevantNodes.length,
      minRadius,
      maxRadius * 0.55,
      nodeSize
    );

    let nodeIndex = 0;
    innerRings.forEach((ring, ringIndex) => {
      const ringStartAngle = startAngle + (ringIndex * Math.PI / 5);

      for (let i = 0; i < ring.count && nodeIndex < relevantNodes.length; i++) {
        const node = relevantNodes[nodeIndex];
        const angle = ringStartAngle + (2 * Math.PI * i) / ring.count;

        positions.set(node.id, {
          x: centerX + ring.radius * Math.cos(angle),
          y: centerY + ring.radius * Math.sin(angle),
        });

        nodeIndex++;
      }
    });
  }

  // 관련 없는 노드들: 외곽 링에 배치
  if (irrelevantNodes.length > 0) {
    const outerRings = calculateRingLayout(
      irrelevantNodes.length,
      maxRadius * 0.65,
      maxRadius,
      nodeSize
    );

    let nodeIndex = 0;
    outerRings.forEach((ring, ringIndex) => {
      const ringStartAngle = startAngle + Math.PI / 4 + (ringIndex * Math.PI / 5);

      for (let i = 0; i < ring.count && nodeIndex < irrelevantNodes.length; i++) {
        const node = irrelevantNodes[nodeIndex];
        const angle = ringStartAngle + (2 * Math.PI * i) / ring.count;

        positions.set(node.id, {
          x: centerX + ring.radius * Math.cos(angle),
          y: centerY + ring.radius * Math.sin(angle),
        });

        nodeIndex++;
      }
    });
  }

  return positions;
}

/**
 * 관련도 기반 투명도 계산
 */
export function calculateOpacity(
  relevanceScore: number | undefined,
  hasActiveSearch: boolean
): number {
  if (!hasActiveSearch) return 1.0;

  const relevance = relevanceScore ?? 0;

  if (relevance === 0) return 0.15;
  if (relevance < 0.3) return 0.3;
  if (relevance < 0.5) return 0.5;
  if (relevance < 0.7) return 0.7;
  return 1.0;
}

/**
 * 관련도 기반 노드 스케일 계산
 */
export function calculateScale(
  relevanceScore: number | undefined,
  hasActiveSearch: boolean
): number {
  if (!hasActiveSearch) return 1.0;

  const relevance = relevanceScore ?? 0;

  // 관련도 높을수록 크게 (0.85 ~ 1.15)
  return 0.85 + relevance * 0.3;
}

/**
 * 두 위치 사이의 거리 계산
 */
export function getDistance(pos1: NodePosition, pos2: NodePosition): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
