/**
 * 방사형 레이아웃 알고리즘
 * - 중심 사용자 기준 유사도/관련도에 따른 위치 계산
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
  minRadius: number;  // 가장 가까운 노드 거리 (기본 150)
  maxRadius: number;  // 가장 먼 노드 거리 (기본 450)
  startAngle?: number; // 시작 각도 (라디안, 기본 0)
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
 * 유사도 기반 방사형 배치 계산
 * 현재 사용자를 중심에 두고 유사도에 따라 방사형으로 배치
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
  } = options;

  // 현재 사용자는 중앙에 배치
  positions.set(currentUserId, { x: centerX, y: centerY });

  // 다른 노드들을 유사도순으로 정렬
  const otherNodes = nodes
    .filter((n) => n.id !== currentUserId)
    .sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0));

  // 각 노드의 위치 계산
  otherNodes.forEach((node, index) => {
    const similarity = node.similarityScore ?? 0;
    const radius = similarityToRadius(similarity, minRadius, maxRadius);
    const angle = getGoldenAngle(index, startAngle);

    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
}

/**
 * 검색 결과 기반 위치 재계산
 * 관련도에 따라 노드들을 재배치
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

  // 관련 노드들: 관련도에 따라 가까이 배치
  relevantNodes.forEach((node, index) => {
    const relevance = node.relevanceScore ?? 0;
    // 관련도 높을수록 가까이 (minRadius ~ maxRadius * 0.6)
    const radius = similarityToRadius(relevance, minRadius, maxRadius * 0.6);
    const angle = getGoldenAngle(index, startAngle);

    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  // 관련 없는 노드들: 외곽에 배치
  const outerStartAngle = startAngle + Math.PI / 4; // 약간 회전
  irrelevantNodes.forEach((node, index) => {
    // 외곽 영역에 배치 (maxRadius * 0.7 ~ maxRadius)
    const radius = maxRadius * 0.7 + (index % 5) * ((maxRadius * 0.3) / 5);
    const angle = getGoldenAngle(index, outerStartAngle);

    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

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
