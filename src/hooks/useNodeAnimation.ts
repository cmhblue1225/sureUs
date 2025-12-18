/**
 * 노드 애니메이션 훅
 * requestAnimationFrame 기반 부드러운 위치 전환
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { easeOutCubic, lerpPosition } from "@/lib/graph/easing";
import type { NodePosition } from "@/lib/graph/radialLayout";
import type { Node } from "@xyflow/react";

interface AnimationState {
  isAnimating: boolean;
  progress: number;
}

interface UseNodeAnimationOptions {
  duration?: number; // 애니메이션 지속 시간 (ms)
  easingFn?: (t: number) => number;
  onComplete?: () => void;
}

interface AnimatedNodeData {
  startPosition: NodePosition;
  targetPosition: NodePosition;
}

/**
 * 노드 위치 애니메이션 훅
 */
export function useNodeAnimation<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  options: UseNodeAnimationOptions = {}
) {
  const {
    duration = 600,
    easingFn = easeOutCubic,
    onComplete,
  } = options;

  const [animatedNodes, setAnimatedNodes] = useState<Node<T>[]>(nodes);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
  });

  // 애니메이션 상태 레퍼런스
  const animationRef = useRef<{
    startTime: number | null;
    frameId: number | null;
    nodeData: Map<string, AnimatedNodeData>;
  }>({
    startTime: null,
    frameId: null,
    nodeData: new Map(),
  });

  // 현재 노드 위치 추적
  const currentPositionsRef = useRef<Map<string, NodePosition>>(new Map());

  // 노드 변경 시 현재 위치 업데이트
  useEffect(() => {
    nodes.forEach((node) => {
      if (!currentPositionsRef.current.has(node.id)) {
        currentPositionsRef.current.set(node.id, {
          x: node.position.x,
          y: node.position.y,
        });
      }
    });
  }, [nodes]);

  /**
   * 애니메이션 프레임 업데이트
   */
  const animateFrame = useCallback(
    (timestamp: number) => {
      const { startTime, nodeData } = animationRef.current;

      if (!startTime) {
        animationRef.current.startTime = timestamp;
        animationRef.current.frameId = requestAnimationFrame(animateFrame);
        return;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(rawProgress);

      // 각 노드의 위치 업데이트
      setAnimatedNodes((prevNodes) =>
        prevNodes.map((node) => {
          const data = nodeData.get(node.id);
          if (!data) return node;

          const newPosition = lerpPosition(
            data.startPosition,
            data.targetPosition,
            easedProgress
          );

          // 현재 위치 저장
          currentPositionsRef.current.set(node.id, newPosition);

          return {
            ...node,
            position: newPosition,
          };
        })
      );

      setAnimationState({
        isAnimating: rawProgress < 1,
        progress: rawProgress,
      });

      if (rawProgress < 1) {
        animationRef.current.frameId = requestAnimationFrame(animateFrame);
      } else {
        // 애니메이션 완료
        animationRef.current.startTime = null;
        animationRef.current.frameId = null;
        onComplete?.();
      }
    },
    [duration, easingFn, onComplete]
  );

  /**
   * 목표 위치로 애니메이션 시작
   */
  const animateTo = useCallback(
    (targetPositions: Map<string, NodePosition>) => {
      // 기존 애니메이션 취소
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }

      // 애니메이션 데이터 설정
      const nodeData = new Map<string, AnimatedNodeData>();

      nodes.forEach((node) => {
        const targetPos = targetPositions.get(node.id);
        if (targetPos) {
          const currentPos = currentPositionsRef.current.get(node.id) || {
            x: node.position.x,
            y: node.position.y,
          };

          nodeData.set(node.id, {
            startPosition: currentPos,
            targetPosition: targetPos,
          });
        }
      });

      animationRef.current = {
        startTime: null,
        frameId: null,
        nodeData,
      };

      // 초기 노드 설정 (data 업데이트 포함)
      setAnimatedNodes(
        nodes.map((node) => ({
          ...node,
          position: currentPositionsRef.current.get(node.id) || node.position,
        }))
      );

      setAnimationState({
        isAnimating: true,
        progress: 0,
      });

      // 애니메이션 시작
      animationRef.current.frameId = requestAnimationFrame(animateFrame);
    },
    [nodes, animateFrame]
  );

  /**
   * 즉시 위치 설정 (애니메이션 없이)
   */
  const setPositions = useCallback(
    (positions: Map<string, NodePosition>) => {
      // 기존 애니메이션 취소
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
        animationRef.current.frameId = null;
      }

      setAnimatedNodes(
        nodes.map((node) => {
          const pos = positions.get(node.id);
          if (pos) {
            currentPositionsRef.current.set(node.id, pos);
            return { ...node, position: pos };
          }
          return node;
        })
      );

      setAnimationState({
        isAnimating: false,
        progress: 1,
      });
    },
    [nodes]
  );

  /**
   * 애니메이션 중지
   */
  const stopAnimation = useCallback(() => {
    if (animationRef.current.frameId) {
      cancelAnimationFrame(animationRef.current.frameId);
      animationRef.current.frameId = null;
      animationRef.current.startTime = null;
    }

    setAnimationState({
      isAnimating: false,
      progress: animationState.progress,
    });
  }, [animationState.progress]);

  /**
   * 노드 data 업데이트 (위치는 유지)
   */
  const updateNodeData = useCallback(
    (updates: Map<string, Partial<T>>) => {
      setAnimatedNodes((prevNodes) =>
        prevNodes.map((node) => {
          const update = updates.get(node.id);
          if (update) {
            return {
              ...node,
              data: { ...node.data, ...update },
            };
          }
          return node;
        })
      );
    },
    []
  );

  // 클린업
  useEffect(() => {
    return () => {
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }
    };
  }, []);

  return {
    animatedNodes,
    animationState,
    animateTo,
    setPositions,
    stopAnimation,
    updateNodeData,
  };
}

/**
 * 단순 값 애니메이션 훅
 */
export function useValueAnimation(
  initialValue: number,
  options: { duration?: number; easingFn?: (t: number) => number } = {}
) {
  const { duration = 300, easingFn = easeOutCubic } = options;

  const [value, setValue] = useState(initialValue);
  const animationRef = useRef<{
    frameId: number | null;
    startTime: number | null;
    startValue: number;
    targetValue: number;
  }>({
    frameId: null,
    startTime: null,
    startValue: initialValue,
    targetValue: initialValue,
  });

  const animateTo = useCallback(
    (target: number) => {
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }

      animationRef.current.startValue = value;
      animationRef.current.targetValue = target;
      animationRef.current.startTime = null;

      const animate = (timestamp: number) => {
        if (!animationRef.current.startTime) {
          animationRef.current.startTime = timestamp;
        }

        const elapsed = timestamp - animationRef.current.startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);

        const { startValue, targetValue } = animationRef.current;
        const newValue = startValue + (targetValue - startValue) * easedProgress;
        setValue(newValue);

        if (progress < 1) {
          animationRef.current.frameId = requestAnimationFrame(animate);
        }
      };

      animationRef.current.frameId = requestAnimationFrame(animate);
    },
    [value, duration, easingFn]
  );

  useEffect(() => {
    return () => {
      if (animationRef.current.frameId) {
        cancelAnimationFrame(animationRef.current.frameId);
      }
    };
  }, []);

  return { value, animateTo, setValue };
}
