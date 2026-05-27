"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/stores/canvas.store";
import { useSemanticZoom } from "@/lib/canvas/useSemanticZoom";
import { useProjectExpand } from "@/lib/canvas/useProjectExpand";
import { restoreDependencyEdgeStyles } from "@/lib/canvas/seedToNodes";
import { useOrgGraph } from "@/lib/api/useOrgGraph";
import { useUIStore } from "@/stores/ui.store";
import { TaskCardNode } from "./nodes/TaskCardNode";
import { ProjectClusterNode } from "./nodes/ProjectClusterNode";
import { PhaseClusterNode } from "./nodes/PhaseClusterNode";
import { PersonAvatarNode } from "./nodes/PersonAvatarNode";
import { DependencyEdge } from "./nodes/DependencyEdge";
import { ReactFlowApiBridge } from "./ReactFlowApiBridge";
import type { ProjectClusterNodeData } from "@/types";

const nodeTypes = {
  taskCard: TaskCardNode,
  projectCluster: ProjectClusterNode,
  phaseCluster: PhaseClusterNode,
  personAvatar: PersonAvatarNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

const defaultEdgeOptions = {
  style: { stroke: "rgba(137, 146, 148, 0.4)", strokeWidth: 1.5 },
  animated: false,
};

function SemanticZoomTracker() {
  useSemanticZoom();
  return null;
}

export const FlowCanvas = React.memo(function FlowCanvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const cascadeChainTaskIds = useCanvasStore((s) => s.cascadeChainTaskIds);
  const cascadeImpact = useCanvasStore((s) => s.cascadeImpact);
  const activeLayer = useCanvasStore((s) => s.activeLayer);

  const skipInitialFitView = useUIStore((s) => s.skipInitialFitView);
  const { handleToggleExpand } = useProjectExpand();
  useOrgGraph();

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        if (node.type === "projectCluster") {
          return {
            ...node,
            data: {
              ...(node.data as ProjectClusterNodeData),
              onToggleExpand: handleToggleExpand,
            },
          };
        }
        return node;
      }),
    );
  }, [handleToggleExpand, setNodes]);

  useEffect(() => {
    if (!cascadeChainTaskIds && !cascadeImpact) {
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

  useEffect(() => {
    if (cascadeChainTaskIds) return;
    if (activeLayer === "workload") return;
    setEdges((current) => restoreDependencyEdgeStyles(current));
  }, [cascadeChainTaskIds, activeLayer, setEdges]);

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
    },
    [setViewport],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPaneClick={onPaneClick}
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
});
