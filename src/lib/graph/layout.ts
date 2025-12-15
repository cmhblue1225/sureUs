/**
 * Layout Algorithm for Network Graph
 *
 * Uses dagre for hierarchical layouts and custom algorithms
 * for cluster-based positioning
 */

import dagre from "@dagrejs/dagre";
import type { ClusterDefinition, ClusteredNode, ClusteredEdge } from "./clustering";

export interface LayoutOptions {
  canvasSize: { width: number; height: number };
  nodeSep?: number;
  rankSep?: number;
  marginX?: number;
  marginY?: number;
}

const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  canvasSize: { width: 800, height: 600 },
  nodeSep: 50,
  rankSep: 100,
  marginX: 50,
  marginY: 50,
};

/**
 * Apply dagre layout to nodes and edges
 */
export function applyDagreLayout(
  nodes: ClusteredNode[],
  edges: ClusteredEdge[],
  options: Partial<LayoutOptions> = {}
): ClusteredNode[] {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: "TB",
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep,
    marginx: opts.marginX,
    marginy: opts.marginY,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 140, height: 60 });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(g);

  // Apply positions
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode?.x ?? node.position.x,
        y: dagreNode?.y ?? node.position.y,
      },
    };
  });
}

/**
 * Apply circular layout for clusters
 */
export function applyCircularClusterLayout(
  clusters: ClusterDefinition[],
  options: Partial<LayoutOptions> = {}
): ClusterDefinition[] {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  const centerX = opts.canvasSize.width / 2;
  const centerY = opts.canvasSize.height / 2;
  const radius = Math.min(opts.canvasSize.width, opts.canvasSize.height) * 0.35;

  return clusters.map((cluster, index) => {
    const angle = (2 * Math.PI * index) / clusters.length - Math.PI / 2;
    return {
      ...cluster,
      center: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
    };
  });
}

/**
 * Position nodes within a cluster in a circular pattern
 */
export function positionNodesInCluster(
  nodes: ClusteredNode[],
  cluster: ClusterDefinition,
  currentUserId?: string
): ClusteredNode[] {
  const { center, radius } = cluster;
  const innerRadius = radius * 0.6;
  const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);

  return nodes.map((node, index) => {
    // Current user at center
    if (currentUserId && node.userId === currentUserId) {
      return { ...node, position: center };
    }

    // Single node at center
    if (nodes.length === 1) {
      return { ...node, position: center };
    }

    // Position around center
    const angle = angleStep * index;
    return {
      ...node,
      position: {
        x: center.x + Math.cos(angle) * innerRadius,
        y: center.y + Math.sin(angle) * innerRadius,
      },
    };
  });
}

/**
 * Calculate force-directed positions (simple spring layout)
 * For small node counts - not for production scale
 */
export function applyForceLayout(
  nodes: ClusteredNode[],
  edges: ClusteredEdge[],
  options: Partial<LayoutOptions> = {},
  iterations: number = 100
): ClusteredNode[] {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  // Clone nodes with initial positions
  const positionedNodes = nodes.map((node) => ({
    ...node,
    vx: 0,
    vy: 0,
  }));

  const centerX = opts.canvasSize.width / 2;
  const centerY = opts.canvasSize.height / 2;

  // Build adjacency for quick lookup
  const adjacency = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  });

  // Force-directed simulation
  const k = 100; // Spring constant
  const repulsion = 5000; // Repulsion constant

  for (let iter = 0; iter < iterations; iter++) {
    const temperature = 1 - iter / iterations;

    // Reset velocities
    positionedNodes.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });

    // Repulsion between all nodes
    for (let i = 0; i < positionedNodes.length; i++) {
      for (let j = i + 1; j < positionedNodes.length; j++) {
        const dx = positionedNodes[j].position.x - positionedNodes[i].position.x;
        const dy = positionedNodes[j].position.y - positionedNodes[i].position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const force = repulsion / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        positionedNodes[i].vx -= fx;
        positionedNodes[i].vy -= fy;
        positionedNodes[j].vx += fx;
        positionedNodes[j].vy += fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const source = positionedNodes.find((n) => n.id === edge.source);
      const target = positionedNodes.find((n) => n.id === edge.target);

      if (!source || !target) return;

      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const force = (dist * dist) / k;

      const fx = (dx / dist) * force * edge.similarity;
      const fy = (dy / dist) * force * edge.similarity;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // Center gravity
    positionedNodes.forEach((node) => {
      const dx = centerX - node.position.x;
      const dy = centerY - node.position.y;
      node.vx += dx * 0.01;
      node.vy += dy * 0.01;
    });

    // Apply velocities with temperature
    positionedNodes.forEach((node) => {
      const maxMove = 50 * temperature;
      const vLen = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (vLen > maxMove) {
        node.vx = (node.vx / vLen) * maxMove;
        node.vy = (node.vy / vLen) * maxMove;
      }

      node.position.x += node.vx;
      node.position.y += node.vy;

      // Keep within bounds
      node.position.x = Math.max(50, Math.min(opts.canvasSize.width - 50, node.position.x));
      node.position.y = Math.max(50, Math.min(opts.canvasSize.height - 50, node.position.y));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return positionedNodes.map(({ vx, vy, ...node }) => node);
}

/**
 * Calculate edge path for curved cross-cluster connections
 */
export function calculateEdgePath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  isCrossDepartment: boolean
): string {
  if (!isCrossDepartment) {
    // Straight line for same department
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  // Bezier curve for cross department
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  // Control point offset perpendicular to line
  const offset = Math.sqrt(dx * dx + dy * dy) * 0.2;
  const controlX = midX - (dy / Math.sqrt(dx * dx + dy * dy)) * offset;
  const controlY = midY + (dx / Math.sqrt(dx * dx + dy * dy)) * offset;

  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
}

/**
 * Auto-fit layout to canvas with padding
 */
export function fitLayoutToCanvas(
  nodes: ClusteredNode[],
  canvasSize: { width: number; height: number },
  padding: number = 50
): ClusteredNode[] {
  if (nodes.length === 0) return nodes;

  // Find bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  });

  // Calculate scale
  const currentWidth = maxX - minX || 1;
  const currentHeight = maxY - minY || 1;
  const availableWidth = canvasSize.width - padding * 2;
  const availableHeight = canvasSize.height - padding * 2;

  const scaleX = availableWidth / currentWidth;
  const scaleY = availableHeight / currentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  // Calculate offset to center
  const scaledWidth = currentWidth * scale;
  const scaledHeight = currentHeight * scale;
  const offsetX = (canvasSize.width - scaledWidth) / 2 - minX * scale;
  const offsetY = (canvasSize.height - scaledHeight) / 2 - minY * scale;

  // Apply transformation
  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x * scale + offsetX,
      y: node.position.y * scale + offsetY,
    },
  }));
}
