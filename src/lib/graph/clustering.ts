/**
 * Multi-Criteria Clustering for Network Graph
 *
 * Primary clustering: Department-based
 * Secondary clustering: Interest similarity within department
 */

import { calculateTagOverlap, getCommonTags } from "@/lib/matching/algorithm";
import {
  calculateEnhancedMatchScore,
  type EnhancedMatchCandidate,
  DEFAULT_ENHANCED_WEIGHTS,
} from "@/lib/matching/enhancedAlgorithm";
import { hasHighSynergy } from "@/lib/matching/departmentScoring";
import { applyForceLayout } from "./layout";

// Cluster color palette
const CLUSTER_COLORS: Record<string, string> = {
  "개발팀": "#3B82F6", // Blue
  "디자인팀": "#EC4899", // Pink
  "기획팀": "#8B5CF6", // Purple
  "마케팅팀": "#F59E0B", // Amber
  "영업팀": "#10B981", // Emerald
  "인사팀": "#06B6D4", // Cyan
  "재무팀": "#84CC16", // Lime
  "운영팀": "#F97316", // Orange
  "고객지원팀": "#14B8A6", // Teal
  "QA팀": "#6366F1", // Indigo
  "데이터팀": "#A855F7", // Violet
  "보안팀": "#EF4444", // Red
  "인프라팀": "#64748B", // Slate
  "경영지원팀": "#78716C", // Stone
  "기타": "#9CA3AF", // Gray
};

export interface ClusterDefinition {
  id: string;
  label: string;
  department: string;
  color: string;
  memberIds: string[];
  center: { x: number; y: number };
  radius: number;
  isExpanded: boolean;
}

export interface ClusteredNode {
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
}

export interface ClusteredEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
  commonTags: string[];
  connectionType: "same_department" | "cross_department";
  strengthLevel: "weak" | "moderate" | "strong";
  mbtiCompatible: boolean;
}

export interface ClusteringResult {
  clusters: ClusterDefinition[];
  nodes: ClusteredNode[];
  edges: ClusteredEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    clusterCount: number;
    averageSimilarity: number;
  };
}

/**
 * Get cluster color for a department
 */
export function getClusterColor(department: string): string {
  return CLUSTER_COLORS[department] || CLUSTER_COLORS["기타"];
}

/**
 * Create clusters from nodes based on department
 */
export function createDepartmentClusters(
  nodes: EnhancedMatchCandidate[],
  currentUserId: string
): Map<string, EnhancedMatchCandidate[]> {
  const clusters = new Map<string, EnhancedMatchCandidate[]>();

  nodes.forEach((node) => {
    const dept = node.department;
    if (!clusters.has(dept)) {
      clusters.set(dept, []);
    }
    clusters.get(dept)!.push(node);
  });

  return clusters;
}

/**
 * Calculate edge data between two nodes
 */
export function calculateEdgeData(
  node1: EnhancedMatchCandidate,
  node2: EnhancedMatchCandidate
): {
  similarity: number;
  commonTags: string[];
  connectionType: "same_department" | "cross_department";
  strengthLevel: "weak" | "moderate" | "strong";
  mbtiCompatible: boolean;
} {
  const scores = calculateEnhancedMatchScore(node1, node2, null, DEFAULT_ENHANCED_WEIGHTS);
  const commonTags = getCommonTags(node1.hobbies, node2.hobbies);

  const connectionType = node1.department === node2.department
    ? "same_department"
    : "cross_department";

  let strengthLevel: "weak" | "moderate" | "strong";
  if (scores.totalScore >= 0.6) {
    strengthLevel = "strong";
  } else if (scores.totalScore >= 0.4) {
    strengthLevel = "moderate";
  } else {
    strengthLevel = "weak";
  }

  const mbtiCompatible = scores.mbtiCompatibilityScore >= 0.75;

  return {
    similarity: scores.totalScore,
    commonTags,
    connectionType,
    strengthLevel,
    mbtiCompatible,
  };
}

/**
 * Build clustered network graph
 */
export function buildClusteredNetwork(
  currentUser: EnhancedMatchCandidate,
  otherUsers: EnhancedMatchCandidate[],
  options: {
    minSimilarity?: number;
    maxNodesPerCluster?: number;
    canvasSize?: { width: number; height: number };
  } = {}
): ClusteringResult {
  const {
    minSimilarity = 0.2,
    maxNodesPerCluster = 10,
    canvasSize = { width: 800, height: 600 },
  } = options;

  // All users including current user
  const allUsers = [currentUser, ...otherUsers];

  // Create department clusters
  const departmentMap = createDepartmentClusters(allUsers, currentUser.userId);
  const departments = Array.from(departmentMap.keys());

  // Calculate dynamic canvas size based on node count
  const totalNodes = allUsers.length;
  const dynamicWidth = Math.max(canvasSize.width, 800 + Math.floor(totalNodes / 10) * 200);
  const dynamicHeight = Math.max(canvasSize.height, 600 + Math.floor(totalNodes / 10) * 150);

  // Position clusters in a circle
  const centerX = dynamicWidth / 2;
  const centerY = dynamicHeight / 2;
  const clusterRadius = Math.min(dynamicWidth, dynamicHeight) * 0.4;

  const clusters: ClusterDefinition[] = [];
  const nodes: ClusteredNode[] = [];

  // Create cluster definitions and position nodes
  departments.forEach((dept, index) => {
    const members = departmentMap.get(dept)!;
    const angle = (2 * Math.PI * index) / departments.length - Math.PI / 2;

    // Cluster center position
    const clusterCenterX = centerX + Math.cos(angle) * clusterRadius;
    const clusterCenterY = centerY + Math.sin(angle) * clusterRadius;

    // Limit members per cluster for performance
    const limitedMembers = members.slice(0, maxNodesPerCluster);

    // Calculate cluster radius based on member count (increased for better spacing)
    // Node width is 140px, so we need radius to accommodate spacing
    const nodeRadius = Math.max(100, Math.min(300, 80 + limitedMembers.length * 25));

    const cluster: ClusterDefinition = {
      id: `cluster-${dept}`,
      label: dept,
      department: dept,
      color: getClusterColor(dept),
      memberIds: limitedMembers.map((m) => m.userId),
      center: { x: clusterCenterX, y: clusterCenterY },
      radius: nodeRadius,
      isExpanded: true, // Default to expanded
    };
    clusters.push(cluster);

    // Position nodes within cluster
    const nodeAngleStep = (2 * Math.PI) / Math.max(limitedMembers.length, 1);
    // Use larger inner radius for better node spacing (node width is 140px)
    const innerRadius = nodeRadius * 0.8;

    limitedMembers.forEach((member, nodeIndex) => {
      let nodeX: number, nodeY: number;

      if (member.userId === currentUser.userId) {
        // Current user at center of their cluster
        nodeX = clusterCenterX;
        nodeY = clusterCenterY;
      } else if (limitedMembers.length === 1) {
        // Single member at center
        nodeX = clusterCenterX;
        nodeY = clusterCenterY;
      } else {
        // Position around cluster center
        const nodeAngle = nodeAngleStep * nodeIndex;
        nodeX = clusterCenterX + Math.cos(nodeAngle) * innerRadius;
        nodeY = clusterCenterY + Math.sin(nodeAngle) * innerRadius;
      }

      nodes.push({
        id: member.userId,
        userId: member.userId,
        name: member.name,
        department: member.department,
        jobRole: member.jobRole,
        officeLocation: member.officeLocation,
        mbti: member.mbti,
        avatarUrl: member.avatarUrl,
        hobbies: member.hobbies,
        isCurrentUser: member.userId === currentUser.userId,
        clusterId: cluster.id,
        position: { x: nodeX, y: nodeY },
      });
    });
  });

  // Build edges
  const edges: ClusteredEdge[] = [];
  let totalSimilarity = 0;
  let edgeCount = 0;

  // Connect current user to other nodes (primary edges)
  nodes.forEach((node) => {
    if (node.userId === currentUser.userId) return;

    const edgeData = calculateEdgeData(
      currentUser,
      otherUsers.find((u) => u.userId === node.userId)!
    );

    if (edgeData.similarity >= minSimilarity) {
      edges.push({
        id: `edge-${currentUser.userId}-${node.userId}`,
        source: currentUser.userId,
        target: node.userId,
        ...edgeData,
      });
      totalSimilarity += edgeData.similarity;
      edgeCount++;
    }
  });

  // Connect nodes with high synergy (cross-department or high similarity)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].userId === currentUser.userId || nodes[j].userId === currentUser.userId) {
        continue; // Already handled above
      }

      const user1 = allUsers.find((u) => u.userId === nodes[i].userId);
      const user2 = allUsers.find((u) => u.userId === nodes[j].userId);

      if (!user1 || !user2) continue;

      const edgeData = calculateEdgeData(user1, user2);

      // Only show edges with significant similarity or cross-department synergy
      const shouldShowEdge =
        edgeData.similarity >= minSimilarity * 1.5 || // Higher threshold for non-current-user edges
        (edgeData.connectionType === "cross_department" && hasHighSynergy(user1.department, user2.department));

      if (shouldShowEdge) {
        edges.push({
          id: `edge-${nodes[i].userId}-${nodes[j].userId}`,
          source: nodes[i].userId,
          target: nodes[j].userId,
          ...edgeData,
        });
        totalSimilarity += edgeData.similarity;
        edgeCount++;
      }
    }
  }

  // Apply Force-Directed layout to prevent node overlapping
  const forceLayoutNodes = applyForceLayout(
    nodes,
    edges,
    { canvasSize: { width: dynamicWidth, height: dynamicHeight } },
    150 // iterations for better convergence
  );

  return {
    clusters,
    nodes: forceLayoutNodes,
    edges,
    stats: {
      totalNodes: forceLayoutNodes.length,
      totalEdges: edges.length,
      clusterCount: clusters.length,
      averageSimilarity: edgeCount > 0 ? totalSimilarity / edgeCount : 0,
    },
  };
}

/**
 * Get nodes for a collapsed cluster (returns single cluster node)
 */
export function getCollapsedClusterNode(cluster: ClusterDefinition): ClusteredNode {
  return {
    id: cluster.id,
    userId: cluster.id,
    name: cluster.label,
    department: cluster.department,
    jobRole: "",
    officeLocation: "",
    hobbies: [],
    isCurrentUser: false,
    clusterId: cluster.id,
    position: cluster.center,
  };
}

/**
 * Filter edges based on minimum similarity threshold
 */
export function filterEdgesBySimilarity(
  edges: ClusteredEdge[],
  minSimilarity: number
): ClusteredEdge[] {
  return edges.filter((edge) => edge.similarity >= minSimilarity);
}

/**
 * Get edges connected to a specific node
 */
export function getConnectedEdges(
  nodeId: string,
  edges: ClusteredEdge[]
): ClusteredEdge[] {
  return edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
}

/**
 * Get nodes connected to a specific node
 */
export function getConnectedNodeIds(
  nodeId: string,
  edges: ClusteredEdge[]
): Set<string> {
  const connectedIds = new Set<string>();
  connectedIds.add(nodeId);

  edges.forEach((edge) => {
    if (edge.source === nodeId) connectedIds.add(edge.target);
    if (edge.target === nodeId) connectedIds.add(edge.source);
  });

  return connectedIds;
}
