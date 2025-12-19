import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceLink,
  forceCenter,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";

// 노드 데이터 타입
export interface ForceNode extends SimulationNodeDatum {
  id: string;
  isCurrentUser?: boolean;
  relevanceScore?: number;
  similarityScore?: number;
}

// 링크 데이터 타입
export interface ForceLink extends SimulationLinkDatum<ForceNode> {
  id: string;
  source: string | ForceNode;
  target: string | ForceNode;
  similarity?: number;
}

// 레이아웃 설정
export interface ForceLayoutConfig {
  width: number;
  height: number;
  repulsion: number;
  collisionRadius: number;
  linkDistance: number;
  linkStrength: number;
  centerStrength: number;
  alphaDecay: number;
  velocityDecay: number;
  iterations: number;
}

// 기본 설정값
export const DEFAULT_FORCE_CONFIG: ForceLayoutConfig = {
  width: 1600,
  height: 1200,
  repulsion: -800,
  collisionRadius: 100,
  linkDistance: 200,
  linkStrength: 0.3,
  centerStrength: 0.05,
  alphaDecay: 0.02,
  velocityDecay: 0.4,
  iterations: 150,
};

// 현재 사용자 노드 오프셋 (노드 카드 크기의 절반, React Flow는 좌상단 기준 배치)
// 노드 카드 크기: 약 180px x 110px → 중심 맞추려면 (-90, -55) 오프셋
const CURRENT_USER_OFFSET_X = -90;
const CURRENT_USER_OFFSET_Y = -55;

// 노드 위치 타입
export interface NodePosition {
  x: number;
  y: number;
}

// 시뮬레이션 결과 타입
export interface ForceLayoutResult {
  positions: Map<string, NodePosition>;
  simulation: Simulation<ForceNode, ForceLink>;
}

/**
 * Force-Directed 레이아웃 시뮬레이션 생성
 */
export function createForceSimulation(
  nodes: ForceNode[],
  links: ForceLink[],
  config: Partial<ForceLayoutConfig> = {}
): Simulation<ForceNode, ForceLink> {
  const cfg = { ...DEFAULT_FORCE_CONFIG, ...config };
  const centerX = cfg.width / 2;
  const centerY = cfg.height / 2;

  // 현재 사용자 노드 찾기
  const currentUserNode = nodes.find((n) => n.isCurrentUser);

  // 노드 초기 위치 설정 (랜덤 분산)
  nodes.forEach((node, i) => {
    if (node.isCurrentUser) {
      node.x = centerX;
      node.y = centerY;
      node.fx = centerX; // 고정
      node.fy = centerY;
    } else if (node.x === undefined || node.y === undefined) {
      // 원형으로 초기 분산
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = 300 + Math.random() * 200;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    }
  });

  const simulation = forceSimulation<ForceNode>(nodes)
    // 노드간 반발력
    .force(
      "charge",
      forceManyBody<ForceNode>()
        .strength(cfg.repulsion)
        .distanceMin(50)
        .distanceMax(500)
    )
    // 충돌 감지 및 방지
    .force(
      "collision",
      forceCollide<ForceNode>()
        .radius(cfg.collisionRadius)
        .strength(0.9)
        .iterations(3)
    )
    // 링크 (연결선)
    .force(
      "link",
      forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .distance((d) => {
          // 유사도가 높을수록 가깝게
          const similarity = (d as ForceLink).similarity || 0.5;
          return cfg.linkDistance * (1.5 - similarity);
        })
        .strength(cfg.linkStrength)
    )
    // 중심 인력
    .force("center", forceCenter(centerX, centerY).strength(cfg.centerStrength))
    // X축 정렬 (현재 사용자 근처로)
    .force(
      "x",
      forceX<ForceNode>(centerX).strength((d) =>
        d.isCurrentUser ? 0 : 0.02
      )
    )
    // Y축 정렬
    .force(
      "y",
      forceY<ForceNode>(centerY).strength((d) =>
        d.isCurrentUser ? 0 : 0.02
      )
    )
    .alphaDecay(cfg.alphaDecay)
    .velocityDecay(cfg.velocityDecay);

  return simulation;
}

/**
 * 시뮬레이션을 지정된 횟수만큼 실행하고 최종 위치 반환
 */
export function runForceSimulation(
  nodes: ForceNode[],
  links: ForceLink[],
  config: Partial<ForceLayoutConfig> = {}
): Map<string, NodePosition> {
  const cfg = { ...DEFAULT_FORCE_CONFIG, ...config };

  // 노드 복사 (원본 변경 방지)
  const nodesCopy = nodes.map((n) => ({ ...n }));
  const linksCopy = links.map((l) => ({ ...l }));

  const simulation = createForceSimulation(nodesCopy, linksCopy, cfg);

  // 지정된 횟수만큼 시뮬레이션 실행
  for (let i = 0; i < cfg.iterations; i++) {
    simulation.tick();
  }

  simulation.stop();

  const centerX = cfg.width / 2;
  const centerY = cfg.height / 2;

  // 위치 맵 생성 - 현재 사용자는 반드시 정중앙에 배치 (오프셋 적용)
  const positions = new Map<string, NodePosition>();
  nodesCopy.forEach((node) => {
    if (node.isCurrentUser) {
      // 현재 사용자는 무조건 정중앙 (오프셋 적용하여 노드 중심이 원 중심에 오도록)
      positions.set(node.id, {
        x: centerX + CURRENT_USER_OFFSET_X,
        y: centerY + CURRENT_USER_OFFSET_Y,
      });
    } else {
      positions.set(node.id, {
        x: node.x ?? centerX,
        y: node.y ?? centerY,
      });
    }
  });

  return positions;
}

/**
 * 검색 결과 기반 레이아웃 (결정적 방식)
 * - 관련도에 따라 정확한 반경에 배치
 * - Force 시뮬레이션 없이 직접 계산하여 일관성 보장
 */
export function runSearchBasedForceLayout(
  nodes: ForceNode[],
  _links: ForceLink[],
  config: Partial<ForceLayoutConfig> = {}
): Map<string, NodePosition> {
  const cfg = { ...DEFAULT_FORCE_CONFIG, ...config };
  const centerX = cfg.width / 2;
  const centerY = cfg.height / 2;

  // 관련도별로 노드 그룹화
  const currentUser = nodes.find(n => n.isCurrentUser);
  const otherNodes = nodes.filter(n => !n.isCurrentUser);

  // 관련도순 정렬
  otherNodes.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  // 관련도 티어별로 그룹화
  const tiers: { nodes: ForceNode[], baseRadius: number }[] = [
    { nodes: [], baseRadius: 200 },  // 70%+ (최고 매칭) - 200px 근처
    { nodes: [], baseRadius: 380 },  // 50-69% (높은 매칭) - 380px 근처
    { nodes: [], baseRadius: 530 },  // 30-49% (관련 있음) - 530px 근처
  ];

  otherNodes.forEach(node => {
    const relevance = node.relevanceScore ?? 0;
    if (relevance >= 0.7) {
      tiers[0].nodes.push(node);
    } else if (relevance >= 0.5) {
      tiers[1].nodes.push(node);
    } else {
      tiers[2].nodes.push(node);
    }
  });

  const positions = new Map<string, NodePosition>();

  // 현재 사용자는 정중앙 (오프셋 적용)
  if (currentUser) {
    positions.set(currentUser.id, {
      x: centerX + CURRENT_USER_OFFSET_X,
      y: centerY + CURRENT_USER_OFFSET_Y,
    });
  }

  // 각 티어별로 원형 배치
  tiers.forEach(tier => {
    const nodeCount = tier.nodes.length;
    if (nodeCount === 0) return;

    // 시작 각도를 랜덤하게 (티어마다 다르게)
    const startAngle = Math.random() * Math.PI * 2;
    const angleStep = (Math.PI * 2) / nodeCount;

    tier.nodes.forEach((node, index) => {
      // 같은 티어 내에서도 관련도에 따라 약간의 반경 차이
      const relevance = node.relevanceScore ?? 0;
      const radiusVariation = (0.5 - Math.random()) * 40; // ±20px 변동
      const radius = tier.baseRadius + radiusVariation;

      const angle = startAngle + angleStep * index;

      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  });

  return positions;
}

/**
 * 관련도 기반 방사형 force (강화된 버전)
 * 노드를 관련도에 맞는 반경에 강하게 배치
 */
function forceRadial(
  nodes: ForceNode[],
  centerX: number,
  centerY: number
) {
  return (alpha: number) => {
    nodes.forEach((node) => {
      if (node.isCurrentUser || node.fx !== undefined) return;

      const relevance = node.relevanceScore ?? 0.5;
      // 관련도에 따른 목표 반경 (넓은 영역, runSearchBasedForceLayout과 동일한 공식)
      // 70% (0.7): 100 + 0.3 * 600 = 280px (300px 영역 내)
      // 50% (0.5): 100 + 0.5 * 600 = 400px (450px 영역 내)
      // 30% (0.3): 100 + 0.7 * 600 = 520px (600px 영역 내)
      const targetRadius = 100 + (1 - relevance) * 600;

      const dx = (node.x ?? centerX) - centerX;
      const dy = (node.y ?? centerY) - centerY;
      const currentRadius = Math.sqrt(dx * dx + dy * dy);

      if (currentRadius > 0) {
        // 매우 강화된 방사형 힘 (0.6 → 0.9)
        const k = ((targetRadius - currentRadius) / currentRadius) * alpha * 0.9;
        node.vx = (node.vx ?? 0) + dx * k;
        node.vy = (node.vy ?? 0) + dy * k;
      } else {
        // 중심에 너무 가까우면 밀어냄
        const angle = Math.random() * 2 * Math.PI;
        node.vx = (node.vx ?? 0) + Math.cos(angle) * targetRadius * alpha * 0.1;
        node.vy = (node.vy ?? 0) + Math.sin(angle) * targetRadius * alpha * 0.1;
      }
    });
  };
}

/**
 * 드래그 시작 시 노드 고정
 */
export function dragStarted(
  simulation: Simulation<ForceNode, ForceLink>,
  node: ForceNode
): void {
  if (!simulation) return;
  simulation.alphaTarget(0.3).restart();
  node.fx = node.x;
  node.fy = node.y;
}

/**
 * 드래그 중 노드 위치 업데이트
 */
export function dragged(node: ForceNode, x: number, y: number): void {
  node.fx = x;
  node.fy = y;
}

/**
 * 드래그 종료 시 노드 해제 (현재 사용자 제외)
 */
export function dragEnded(
  simulation: Simulation<ForceNode, ForceLink>,
  node: ForceNode
): void {
  if (!simulation) return;
  simulation.alphaTarget(0);
  if (!node.isCurrentUser) {
    node.fx = undefined;
    node.fy = undefined;
  }
}

/**
 * 시뮬레이션 재시작
 */
export function restartSimulation(
  simulation: Simulation<ForceNode, ForceLink>,
  alpha: number = 0.3
): void {
  simulation.alpha(alpha).restart();
}

/**
 * 시뮬레이션 중지
 */
export function stopSimulation(
  simulation: Simulation<ForceNode, ForceLink>
): void {
  simulation.stop();
}
