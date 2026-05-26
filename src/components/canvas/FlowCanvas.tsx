"use client";

import React, { useCallback } from "react";
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

const nodeTypes = {};
const edgeTypes = {};

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
    (_: MouseEvent | TouchEvent | null, viewport: { x: number; y: number; zoom: number }) => {
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
      fitView
      className="canvas-dot-grid"
      proOptions={{ hideAttribution: true }}
    >
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
