export interface NetworkNode {
  id: string;
  type: "user" | "cluster";
  data: {
    name: string;
    department?: string;
    jobRole?: string;
    avatarUrl?: string;
    isCurrentUser: boolean;
    clusterLabel?: string;
    memberCount?: number;
  };
  position?: { x: number; y: number };
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  data: {
    similarity: number;
    commonTags?: string[];
  };
}

export interface NetworkCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters?: NetworkCluster[];
}
