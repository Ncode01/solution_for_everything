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
import { TaskCardNode } from "./nodes/TaskCardNode";
import { ProjectClusterNode } from "./nodes/ProjectClusterNode";
import { PhaseClusterNode } from "./nodes/PhaseClusterNode";
import { PersonAvatarNode } from "./nodes/PersonAvatarNode";
import { DependencyEdge } from "./nodes/DependencyEdge";
import { MilestoneNode } from "./nodes/MilestoneNode";
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
import { useUIStore } from "@/stores/ui.store";
import type { ProjectClusterNodeData } from "@/types";

const nodeTypes = {
  taskCard: TaskCardNode,
  projectCluster: ProjectClusterNode,
  phaseCluster: PhaseClusterNode,
  personAvatar: PersonAvatarNode,
  milestoneNode: MilestoneNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
  crossProject: CrossProjectEdge,
};

const defaultEdgeOptions = {
  style: { stroke: "rgba(137, 146, 148, 0.4)", strokeWidth: 1.5 },
  animated: false,
};

function SemanticZoomTracker() {
  useSemanticZoom();
  return null;
}

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
    () =>
      queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        process.env.NEXT_PUBLIC_ORG_ID ?? "",
      ]),
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

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
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
      setNodes((nds) => applyNodeChanges(changes, nds)),
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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
      <SemanticZoomTracker />
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
        nodeColor="rgba(137,146,148,0.3)"
        position="bottom-right"
      />
    </ReactFlow>
  );
}

export const FlowCanvas = React.memo(function FlowCanvas() {
  return <FlowCanvasInner />;
});
