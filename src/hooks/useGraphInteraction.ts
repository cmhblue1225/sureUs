/**
 * Graph Interaction Hook
 *
 * Manages hover states, connected node highlighting,
 * and interactive behaviors for the network graph
 */

import { useState, useCallback, useMemo } from "react";
import type { ClusteredNode, ClusteredEdge, ClusterDefinition } from "@/lib/graph/clustering";

export interface GraphInteractionState {
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  expandedClusterIds: Set<string>;
  connectedNodeIds: Set<string>;
}

export interface UseGraphInteractionReturn {
  // State
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  expandedClusterIds: Set<string>;
  connectedNodeIds: Set<string>;

  // Node interaction
  onNodeHover: (nodeId: string | null) => void;
  onNodeSelect: (nodeId: string | null) => void;
  isNodeHighlighted: (nodeId: string) => boolean;
  isNodeDimmed: (nodeId: string) => boolean;

  // Edge interaction
  onEdgeSelect: (edgeId: string | null) => void;
  isEdgeHighlighted: (edgeId: string) => boolean;
  isEdgeDimmed: (edgeId: string) => boolean;

  // Cluster interaction
  toggleClusterExpansion: (clusterId: string) => void;
  isClusterExpanded: (clusterId: string) => boolean;
  expandAllClusters: () => void;
  collapseAllClusters: () => void;

  // Reset
  resetSelection: () => void;
}

export function useGraphInteraction(
  edges: ClusteredEdge[],
  clusters: ClusterDefinition[]
): UseGraphInteractionReturn {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(
    () => new Set(clusters.map((c) => c.id))
  );

  // Build connected nodes map for quick lookup
  const connectedNodeIds = useMemo(() => {
    const activeNodeId = hoveredNodeId || selectedNodeId;
    if (!activeNodeId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(activeNodeId);

    edges.forEach((edge) => {
      if (edge.source === activeNodeId) {
        connected.add(edge.target);
      }
      if (edge.target === activeNodeId) {
        connected.add(edge.source);
      }
    });

    return connected;
  }, [hoveredNodeId, selectedNodeId, edges]);

  // Connected edges for selected edge highlighting
  const connectedEdgeIds = useMemo(() => {
    const activeNodeId = hoveredNodeId || selectedNodeId;
    if (!activeNodeId) return new Set<string>();

    return new Set(
      edges
        .filter((e) => e.source === activeNodeId || e.target === activeNodeId)
        .map((e) => e.id)
    );
  }, [hoveredNodeId, selectedNodeId, edges]);

  // Node interaction handlers
  const onNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const onNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const isNodeHighlighted = useCallback(
    (nodeId: string): boolean => {
      const activeNodeId = hoveredNodeId || selectedNodeId;
      if (!activeNodeId) return false;
      return connectedNodeIds.has(nodeId);
    },
    [hoveredNodeId, selectedNodeId, connectedNodeIds]
  );

  const isNodeDimmed = useCallback(
    (nodeId: string): boolean => {
      const activeNodeId = hoveredNodeId || selectedNodeId;
      if (!activeNodeId) return false;
      return !connectedNodeIds.has(nodeId);
    },
    [hoveredNodeId, selectedNodeId, connectedNodeIds]
  );

  // Edge interaction handlers
  const onEdgeSelect = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  const isEdgeHighlighted = useCallback(
    (edgeId: string): boolean => {
      const activeNodeId = hoveredNodeId || selectedNodeId;
      if (!activeNodeId) return false;
      return connectedEdgeIds.has(edgeId);
    },
    [hoveredNodeId, selectedNodeId, connectedEdgeIds]
  );

  const isEdgeDimmed = useCallback(
    (edgeId: string): boolean => {
      const activeNodeId = hoveredNodeId || selectedNodeId;
      if (!activeNodeId) return false;
      return !connectedEdgeIds.has(edgeId);
    },
    [hoveredNodeId, selectedNodeId, connectedEdgeIds]
  );

  // Cluster interaction handlers
  const toggleClusterExpansion = useCallback((clusterId: string) => {
    setExpandedClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  }, []);

  const isClusterExpanded = useCallback(
    (clusterId: string): boolean => {
      return expandedClusterIds.has(clusterId);
    },
    [expandedClusterIds]
  );

  const expandAllClusters = useCallback(() => {
    setExpandedClusterIds(new Set(clusters.map((c) => c.id)));
  }, [clusters]);

  const collapseAllClusters = useCallback(() => {
    setExpandedClusterIds(new Set());
  }, []);

  // Reset all selection
  const resetSelection = useCallback(() => {
    setHoveredNodeId(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  return {
    hoveredNodeId,
    selectedNodeId,
    selectedEdgeId,
    expandedClusterIds,
    connectedNodeIds,

    onNodeHover,
    onNodeSelect,
    isNodeHighlighted,
    isNodeDimmed,

    onEdgeSelect,
    isEdgeHighlighted,
    isEdgeDimmed,

    toggleClusterExpansion,
    isClusterExpanded,
    expandAllClusters,
    collapseAllClusters,

    resetSelection,
  };
}
