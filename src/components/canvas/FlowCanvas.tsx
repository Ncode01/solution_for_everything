"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/stores/canvas.store";
import { useSemanticZoom } from "@/lib/canvas/useSemanticZoom";
import { useProjectExpand } from "@/lib/canvas/useProjectExpand";
import { restoreDependencyEdgeStyles } from "@/lib/canvas/dependencyEdgeStyles";
import type { OrgGraphResponse } from "@/lib/api/types";
import { DependencyEdge } from "./nodes/DependencyEdge";
import { CrossProjectEdge } from "./nodes/CrossProjectEdge";
import { SwimlaneBands } from "./SwimlaneBands";
import { ReactFlowApiBridge } from "./ReactFlowApiBridge";
import {
  applyOptimisticTaskPosition,
  useUpdateTaskMutation,
} from "@/lib/api/useTaskMutations";
import {
  applyOptimisticMilestonePosition,
  applyOptimisticProjectPosition,
  useUpdateMilestonePositionMutation,
  useUpdateProjectPositionMutation,
} from "@/lib/api/usePositionMutations";
import { logDevOnce } from "@/lib/diagnostics";
import {
  ENVELOPE_BODY_TOP_OFFSET,
  ENVELOPE_HEADER_HEIGHT,
  ENVELOPE_PADDING_X,
} from "@/lib/canvas/layout";
import { useUIStore } from "@/stores/ui.store";
import type { ProjectClusterNodeData, ProjectEnvelopeNodeData } from "@/types";
import { nodeTypes } from "@/components/nodes";
import { persistCanvasNodePositions } from "@/lib/canvas/persistence";

const ORG_GRAPH_QUERY_KEY = [
  "org-graph",
  process.env.NEXT_PUBLIC_ORG_ID ?? "",
] as const;

const BOARD_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "default";

const edgeTypes = {
  dependency: DependencyEdge,
  crossProject: CrossProjectEdge,
};

const defaultEdgeOptions = {
  style: { stroke: "rgba(137, 146, 148, 0.4)", strokeWidth: 1.5 },
  animated: false,
};

function FlowCanvasInner() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const projectClusterCount = useCanvasStore(
    (s) => s.nodes.filter((n) => n.type === "projectCluster").length,
  );
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const cascadeChainTaskIds = useCanvasStore((s) => s.cascadeChainTaskIds);
  const cascadeImpact = useCanvasStore((s) => s.cascadeImpact);
  const activeLayer = useCanvasStore((s) => s.activeLayer);

  const skipInitialFitView = useUIStore((s) => s.skipInitialFitView);
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const broadcastCursor = useUIStore((s) => s.broadcastCursor);
  const broadcastViewport = useUIStore((s) => s.broadcastViewport);
  const { screenToFlowPosition } = useReactFlow();
  const { handleToggleExpand } = useProjectExpand();
  const queryClient = useQueryClient();
  const getGraphSnapshot = useCallback(
    () => queryClient.getQueryData<OrgGraphResponse>([...ORG_GRAPH_QUERY_KEY]),
    [queryClient],
  );

  const updateTaskPosition = useUpdateTaskMutation();
  const updateProjectPosition = useUpdateProjectPositionMutation();
  const updateMilestonePosition = useUpdateMilestonePositionMutation();
  const updateTaskPositionRef = useRef(updateTaskPosition);
  const updateProjectPositionRef = useRef(updateProjectPosition);
  const updateMilestonePositionRef = useRef(updateMilestonePosition);
  updateTaskPositionRef.current = updateTaskPosition;
  updateProjectPositionRef.current = updateProjectPosition;
  updateMilestonePositionRef.current = updateMilestonePosition;

  const dragSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthLoggedRef = useRef(false);
  const envelopeDragStartRef = useRef<{
    envelopeId: string;
    projectId: string;
    startPos: { x: number; y: number };
    nodeSnapshots: Map<string, { x: number; y: number }>;
  } | null>(null);

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!node.id.startsWith("envelope-")) return;

      const projectId = node.id.replace("envelope-", "");
      const graph = queryClient.getQueryData<OrgGraphResponse>([
        ...ORG_GRAPH_QUERY_KEY,
      ]);
      if (!graph) return;

      const projectPhaseIds = new Set(
        graph.phases
          .filter((ph) => ph.projectId === projectId)
          .map((ph) => ph.id),
      );
      const projectMilestoneIds = new Set(
        (graph.milestones ?? [])
          .filter((m) => m.projectId === projectId)
          .map((m) => m.id),
      );
      const projectTaskIds = new Set(
        graph.tasks
          .filter((t) => t.projectId === projectId)
          .map((t) => t.id),
      );

      const currentNodes = useCanvasStore.getState().nodes;
      const snapshots = new Map<string, { x: number; y: number }>();

      for (const n of currentNodes) {
        if (n.id === `project-${projectId}`) {
          snapshots.set(n.id, { ...n.position });
          continue;
        }
        if (n.id.startsWith(`phase-${projectId}-`)) {
          snapshots.set(n.id, { ...n.position });
          continue;
        }
        if (n.id.startsWith("phase-header-")) {
          const phaseId = n.id.replace("phase-header-", "");
          if (projectPhaseIds.has(phaseId)) {
            snapshots.set(n.id, { ...n.position });
          }
          continue;
        }
        if (n.id.startsWith("milestone-")) {
          const milestoneId = n.id.replace("milestone-", "");
          if (projectMilestoneIds.has(milestoneId)) {
            snapshots.set(n.id, { ...n.position });
          }
          continue;
        }
        if (n.id.startsWith("task-")) {
          const taskId = n.id.replace("task-", "");
          if (projectTaskIds.has(taskId)) {
            snapshots.set(n.id, { ...n.position });
          }
        }
      }

      envelopeDragStartRef.current = {
        envelopeId: node.id,
        projectId,
        startPos: { ...node.position },
        nodeSnapshots: snapshots,
      };
    },
    [queryClient],
  );

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("envelope-")) {
        const drag = envelopeDragStartRef.current;
        if (!drag || drag.envelopeId !== node.id) return;

        const dx = node.position.x - drag.startPos.x;
        const dy = node.position.y - drag.startPos.y;

        setNodes((allNodes) =>
          allNodes.map((n) => {
            const snap = drag.nodeSnapshots.get(n.id);
            if (!snap) return n;
            return {
              ...n,
              position: { x: snap.x + dx, y: snap.y + dy },
            };
          }),
        );
        return;
      }

      if (node.id.startsWith("project-")) {
        const projectId = node.id.replace("project-", "");
        setNodes((allNodes) =>
          allNodes.map((n) => {
            if (n.id !== `envelope-${projectId}`) return n;
            return {
              ...n,
              position: {
                x: node.position.x - ENVELOPE_PADDING_X,
                y:
                  node.position.y -
                  ENVELOPE_HEADER_HEIGHT -
                  ENVELOPE_BODY_TOP_OFFSET,
              },
            };
          }),
        );
      }
    },
    [setNodes],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("envelope-")) {
        const drag = envelopeDragStartRef.current;
        envelopeDragStartRef.current = null;
        if (!drag) return;

        const dx = node.position.x - drag.startPos.x;
        const dy = node.position.y - drag.startPos.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        for (const [nodeId, snap] of drag.nodeSnapshots) {
          const newX = Math.round(snap.x + dx);
          const newY = Math.round(snap.y + dy);

          if (nodeId.startsWith("task-")) {
            const taskId = nodeId.replace("task-", "");
            applyOptimisticTaskPosition(queryClient, taskId, newX, newY);
            void updateTaskPositionRef.current.mutate({
              taskId,
              body: { canvasX: newX, canvasY: newY },
            });
          }
          if (nodeId.startsWith("project-")) {
            const projectId = nodeId.replace("project-", "");
            applyOptimisticProjectPosition(
              queryClient,
              projectId,
              newX,
              newY,
            );
            void updateProjectPositionRef.current.mutate({
              projectId,
              body: { canvasX: newX, canvasY: newY },
            });
          }
        }
        return;
      }

      const canvasX = Math.round(node.position.x);
      const canvasY = Math.round(node.position.y);

      if (node.id.startsWith("task-")) {
        const taskId = node.id.replace("task-", "");
        applyOptimisticTaskPosition(queryClient, taskId, canvasX, canvasY);

        if (!updateTaskPositionRef.current?.mutate) {
          logDevOnce(
            "flowcanvas-drag-mutation-missing",
            "[FlowCanvas] drag save skipped: mutation ref unavailable",
          );
          return;
        }

        if (dragSaveTimerRef.current) {
          clearTimeout(dragSaveTimerRef.current);
        }
        dragSaveTimerRef.current = setTimeout(() => {
          void updateTaskPositionRef.current.mutate({
            taskId,
            body: { canvasX, canvasY },
          });
        }, 300);
        return;
      }

      if (node.id.startsWith("project-")) {
        const projectId = node.id.replace("project-", "");
        applyOptimisticProjectPosition(
          queryClient,
          projectId,
          canvasX,
          canvasY,
        );

        if (projectDragTimerRef.current) {
          clearTimeout(projectDragTimerRef.current);
        }
        projectDragTimerRef.current = setTimeout(() => {
          void updateProjectPositionRef.current.mutate({
            projectId,
            body: { canvasX, canvasY },
          });
        }, 400);
        return;
      }

      if (node.id.startsWith("milestone-")) {
        const milestoneId = node.id.replace("milestone-", "");
        applyOptimisticMilestonePosition(
          queryClient,
          milestoneId,
          canvasX,
          canvasY,
        );

        if (milestoneDragTimerRef.current) {
          clearTimeout(milestoneDragTimerRef.current);
        }
        milestoneDragTimerRef.current = setTimeout(() => {
          void updateMilestonePositionRef.current.mutate({
            milestoneId,
            body: { canvasX, canvasY },
          });
        }, 400);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    return () => {
      if (dragSaveTimerRef.current) clearTimeout(dragSaveTimerRef.current);
      if (projectDragTimerRef.current) clearTimeout(projectDragTimerRef.current);
      if (milestoneDragTimerRef.current) {
        clearTimeout(milestoneDragTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        if (node.id.startsWith("envelope-")) return node;
        const isSelected = node.id === selectedNodeId;
        const wasSelected = node.style?.outline !== undefined;
        if (!isSelected && !wasSelected) return node;
        return {
          ...node,
          style: isSelected
            ? {
                ...node.style,
                outline: "2px solid rgba(255,255,255,0.25)",
                outlineOffset: "3px",
                borderRadius: "14px",
              }
            : {
                ...node.style,
                outline: undefined,
                outlineOffset: undefined,
              },
        };
      }),
    );
  }, [selectedNodeId, setNodes]);

  useEffect(() => {
    if (healthLoggedRef.current || process.env.NODE_ENV === "production") {
      return;
    }
    healthLoggedRef.current = true;
    const currentNodes = useCanvasStore.getState().nodes;
    const projectClusters = currentNodes.filter(
      (n) => n.type === "projectCluster",
    ).length;
    const tasks = currentNodes.filter((n) => n.id.startsWith("task-")).length;
    logDevOnce(
      "flowcanvas-health",
      `[FlowCanvas] mount health: projects=${projectClusters} tasks=${tasks} loading=${isCanvasLoading} skipFitView=${skipInitialFitView}`,
    );
  }, [isCanvasLoading, skipInitialFitView]);

  // Wire onToggleExpand once on mount and whenever nodes list changes by count
  // (new project added), NOT on every handleToggleExpand identity change
  const projectNodeCountRef = useRef(-1);
  const handleToggleExpandRef = useRef(handleToggleExpand);
  handleToggleExpandRef.current = handleToggleExpand;

  useEffect(() => {
    if (projectClusterCount === projectNodeCountRef.current) {
      logDevOnce(
        "flowcanvas-project-wiring-skip",
        "[FlowCanvas] project wiring skipped: count unchanged",
      );
      return;
    }
    projectNodeCountRef.current = projectClusterCount;
    setNodes((current) =>
      current.map((node) => {
        if (node.type === "projectCluster") {
          return {
            ...node,
            data: {
              ...(node.data as ProjectClusterNodeData),
              onToggleExpand: handleToggleExpandRef.current,
            },
          };
        }
        return node;
      }),
    );
  }, [projectClusterCount, setNodes]);

  const prevCascadeRef = useRef<{
    ids: string[] | null;
    impact: typeof cascadeImpact;
  }>({
    ids: null,
    impact: null,
  });

  useEffect(() => {
    const prevIds = prevCascadeRef.current.ids;
    const prevImpact = prevCascadeRef.current.impact;
    prevCascadeRef.current = { ids: cascadeChainTaskIds, impact: cascadeImpact };

    if (!cascadeChainTaskIds && !cascadeImpact) {
      if (prevIds === null && prevImpact === null) {
        logDevOnce(
          "flowcanvas-cascade-clear-skip",
          "[FlowCanvas] cascade clear skipped: initial mount",
        );
        return;
      }
      setNodes((current) =>
        current.map((node) => {
          if (!node.id.startsWith("task-")) return node;
          const { style: _style, ...rest } = node;
          void _style;
          return rest;
        }),
      );
      return;
    }
    if (activeLayer === "workload") return;

    const highlightIds = new Set(cascadeChainTaskIds ?? []);
    if (cascadeImpact?.sourceTaskId) {
      highlightIds.add(cascadeImpact.sourceTaskId);
    }

    setNodes((current) =>
      current.map((node) => {
        if (!node.id.startsWith("task-")) return node;
        const taskId = node.id.replace("task-", "");
        if (!highlightIds.has(taskId)) {
          const { style: _style, ...rest } = node;
          void _style;
          return rest;
        }
        const isSource = taskId === cascadeImpact?.sourceTaskId;
        return {
          ...node,
          style: {
            boxShadow: isSource
              ? "0 0 0 2px rgba(221, 105, 116, 0.6)"
              : "0 0 0 2px rgba(232, 175, 52, 0.6)",
          },
        };
      }),
    );
  }, [cascadeChainTaskIds, cascadeImpact, activeLayer, setNodes]);

  useEffect(() => {
    if (!cascadeChainTaskIds || activeLayer === "workload") return;

    const chainSet = new Set(cascadeChainTaskIds);
    setEdges((current) =>
      current.map((edge) => {
        if (!edge.id.startsWith("dep-")) return edge;
        const sourceTaskId = edge.source.replace("task-", "");
        const targetTaskId = edge.target.replace("task-", "");
        const isInChain =
          chainSet.has(sourceTaskId) || chainSet.has(targetTaskId);
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: isInChain ? 1 : 0.15,
            stroke: isInChain
              ? "rgba(232, 175, 52, 0.8)"
              : edge.style?.stroke,
          },
        };
      }),
    );
  }, [cascadeChainTaskIds, activeLayer, setEdges]);

  const prevCascadeEdgeRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (cascadeChainTaskIds !== null) {
      prevCascadeEdgeRef.current = cascadeChainTaskIds;
      return;
    }
    if (prevCascadeEdgeRef.current === null) {
      logDevOnce(
        "flowcanvas-edge-restore-skip",
        "[FlowCanvas] edge restore skipped: initial mount",
      );
      return;
    }
    prevCascadeEdgeRef.current = null;
    if (activeLayer === "workload") return;
    setEdges((current) =>
      restoreDependencyEdgeStyles(current, getGraphSnapshot()),
    );
  }, [cascadeChainTaskIds, activeLayer, setEdges, getGraphSnapshot]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        const hasDragEnd = changes.some(
          (change) => change.type === "position" && change.dragging === false,
        );
        if (hasDragEnd) {
          persistCanvasNodePositions(BOARD_ID, nextNodes);
        }
        return nextNodes;
      }),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null, null);
  }, [selectNode]);

  const onMoveEnd = useCallback(
    (
      _: MouseEvent | TouchEvent | null,
      viewport: { x: number; y: number; zoom: number },
    ) => {
      setViewport(viewport);
      broadcastViewport?.(viewport.x, viewport.y, viewport.zoom);
    },
    [setViewport, broadcastViewport],
  );

  const onPaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      broadcastCursor?.(position.x, position.y);
    },
    [broadcastCursor, screenToFlowPosition],
  );

  useSemanticZoom();

  const miniMapNodeColor = useCallback((node: Node): string => {
    const COLOR_MAP: Record<string, string> = {
      coral: "#E57373",
      amber: "#E8AF34",
      violet: "#9C7EC7",
      sky: "#5591C7",
      mint: "#6DAA45",
    };
    if (node.id.startsWith("envelope-")) {
      const color = (node.data as ProjectEnvelopeNodeData).projectColor;
      return `${COLOR_MAP[color] ?? "#5591C7"}40`;
    }
    return "rgba(137,146,148,0.3)";
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onPaneClick={onPaneClick}
      onPaneMouseMove={onPaneMouseMove}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      minZoom={0.05}
      maxZoom={3}
      fitView={!skipInitialFitView}
      className="canvas-dot-grid"
      proOptions={{ hideAttribution: true }}
    >
      <ReactFlowApiBridge />
      <SwimlaneBands />
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(205,204,202,0.04)"
        style={{ backgroundColor: "#0E0D0C" }}
      />
      <MiniMap
        className="!rounded-lg !border !border-white/5 !bg-surface-container"
        maskColor="rgba(14,13,12,0.6)"
        nodeColor={miniMapNodeColor}
        position="bottom-right"
      />
    </ReactFlow>
  );
}

export const FlowCanvas = React.memo(function FlowCanvas() {
  return <FlowCanvasInner />;
});
