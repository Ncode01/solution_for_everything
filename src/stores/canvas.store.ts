import { create } from "zustand";
import type { Edge, Node, Viewport } from "@xyflow/react";
import type { ActiveLayer, ZoomLevel } from "@/types";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  zoomLevel: ZoomLevel;
  selectedNodeId: string | null;
  selectedNodeType: "task" | "project" | "phase" | "person" | null;
  activeLayer: ActiveLayer;
  expandedProjects: Set<string>;
  cascadeChainTaskIds: string[] | null;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setViewport: (viewport: Viewport) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  selectNode: (
    id: string | null,
    type: CanvasState["selectedNodeType"],
  ) => void;
  setActiveLayer: (layer: ActiveLayer) => void;
  toggleProjectExpanded: (projectId: string) => void;
  setCascadeChain: (taskIds: string[] | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  zoomLevel: "Z2",
  selectedNodeId: null,
  selectedNodeType: null,
  activeLayer: "default",
  expandedProjects: new Set(),
  cascadeChainTaskIds: null,
  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === "function" ? edges(state.edges) : edges,
    })),
  setViewport: (viewport) => set({ viewport }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  selectNode: (selectedNodeId, selectedNodeType) =>
    set({ selectedNodeId, selectedNodeType }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  toggleProjectExpanded: (projectId) =>
    set((state) => {
      const next = new Set(state.expandedProjects);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return { expandedProjects: next };
    }),
  setCascadeChain: (cascadeChainTaskIds) => set({ cascadeChainTaskIds }),
}));
