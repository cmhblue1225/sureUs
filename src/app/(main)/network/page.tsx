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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, User } from "lucide-react";
import type { NetworkNode, NetworkEdge } from "@/types/graph";
import Link from "next/link";

// Custom node component
function UserNode({ data }: { data: NetworkNode["data"] }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm bg-card transition-all ${
        data.isCurrentUser
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50"
      }`}
      style={{ minWidth: 140 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{data.name}</p>
          {data.department && (
            <p className="text-xs text-muted-foreground truncate">
              {data.department}
            </p>
          )}
        </div>
      </div>
      {data.isCurrentUser && (
        <Badge variant="default" className="mt-2 text-xs">
          나
        </Badge>
      )}
    </div>
  );
}

const nodeTypes = {
  user: UserNode,
};

export default function NetworkPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchNetwork = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/graph/network?topK=8");
      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      // Convert to React Flow format
      const flowNodes: Node[] = data.data.nodes.map((node: NetworkNode) => ({
        id: node.id,
        type: "user",
        data: node.data,
        position: node.position || { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }));

      const flowEdges: Edge[] = data.data.edges.map((edge: NetworkEdge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data,
        style: {
          stroke: `hsl(var(--primary))`,
          strokeWidth: Math.max(1, edge.data.similarity * 3),
          opacity: 0.5 + edge.data.similarity * 0.5,
        },
        animated: edge.data.similarity > 0.5,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      setError("네트워크를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const originalNode = nodes.find((n) => n.id === node.id);
      if (originalNode) {
        setSelectedNode({
          id: originalNode.id,
          type: "user",
          data: originalNode.data as NetworkNode["data"],
          position: originalNode.position,
        });
        setSelectedEdge(null);
      }
    },
    [nodes]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data as NetworkEdge["data"],
      });
      setSelectedNode(null);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
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
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={1.5}
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) =>
                    (node.data as NetworkNode["data"]).isCurrentUser
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))"
                  }
                />
              </ReactFlow>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">그래프 안내</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 노드를 클릭하여 상세 정보를 확인하세요</li>
                <li>• 연결선은 공통 관심사를 나타냅니다</li>
                <li>• 선이 굵을수록 더 많은 관심사가 겹칩니다</li>
                <li>• 마우스 휠로 확대/축소할 수 있습니다</li>
              </ul>
            </CardContent>
          </Card>

          {/* Selected Node Info */}
          {selectedNode && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    {selectedNode.data.avatarUrl ? (
                      <img
                        src={selectedNode.data.avatarUrl}
                        alt={selectedNode.data.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedNode.data.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedNode.data.department}
                    </p>
                  </div>
                </div>

                {selectedNode.data.jobRole && (
                  <p className="text-sm mb-4">{selectedNode.data.jobRole}</p>
                )}

                {!selectedNode.data.isCurrentUser && (
                  <Link href={`/profile/${selectedNode.id}`}>
                    <Button className="w-full" variant="outline">
                      프로필 보기
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Edge Info */}
          {selectedEdge && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">연결 정보</h3>
                {selectedEdge.data.commonTags &&
                  selectedEdge.data.commonTags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        공통 관심사:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedEdge.data.commonTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">범례</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary" />
                  <span>나</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-card border-2 border-border" />
                  <span>동료</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-primary" />
                  <span>공통 관심사</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
