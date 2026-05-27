"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import type { OrgGraphResponse } from "@/lib/api/types";
import { useWorkloadLayer } from "@/lib/canvas/useWorkloadLayer";
import { fitCanvasView, focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import type { CommandDefinition } from "@/types/commands";
import type { TaskCardNodeData } from "@/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useCommandRegistry(): CommandDefinition[] {
  const queryClient = useQueryClient();
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const isCommandPaletteOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const selectNode = useCanvasStore((s) => s.selectNode);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const activeView = useUIStore((s) => s.activeView);

  const { toggleWorkloadLayer } = useWorkloadLayer();

  return useMemo(() => {
    const getSelectedTask = () => {
      if (selectedNodeType !== "task" || !selectedNodeId) return null;
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (!node) return null;
      return (node.data as TaskCardNodeData).task;
    };

    const commands: CommandDefinition[] = [
      {
        id: "open-canvas-view",
        label: "Open Canvas",
        keywords: ["canvas", "view", "spatial"],
        group: "navigation",
        shortcut: ["G", "C"],
        contexts: ["global"],
        perform: () => setActiveView("canvas"),
      },
      {
        id: "open-dashboard-view",
        label: "Open Dashboard",
        keywords: ["dashboard", "kpi", "analytics"],
        group: "navigation",
        shortcut: ["G", "D"],
        contexts: ["global"],
        perform: () => setActiveView("dashboard"),
      },
      {
        id: "open-gantt-view",
        label: "Open Gantt",
        keywords: ["gantt", "timeline", "schedule"],
        group: "navigation",
        shortcut: ["G", "G"],
        contexts: ["global"],
        perform: () => setActiveView("gantt"),
      },
      {
        id: "toggle-command-palette",
        label: "Toggle Command Palette",
        keywords: ["command", "palette", "search", "cmdk"],
        group: "view",
        shortcut: ["Meta", "K"],
        contexts: ["global"],
        perform: () => {
          if (isCommandPaletteOpen) closeCommandPalette();
          else openCommandPalette();
        },
      },
      {
        id: "close-right-panel",
        label: "Close Right Panel",
        keywords: ["panel", "close", "inspector"],
        group: "view",
        shortcut: ["Escape"],
        contexts: ["global"],
        isVisible: () => isRightPanelOpen,
        perform: () => closeRightPanel(),
      },
      {
        id: "toggle-workload-view",
        label: "Toggle Workload View",
        keywords: ["workload", "heatmap", "capacity", "people"],
        group: "view",
        shortcut: ["Shift", "W"],
        contexts: ["global", "canvas"],
        perform: () => toggleWorkloadLayer(),
      },
      {
        id: "clear-selection",
        label: "Clear Selection",
        keywords: ["deselect", "clear", "selection"],
        group: "canvas",
        shortcut: ["Escape"],
        contexts: ["canvas"],
        isVisible: () => selectedNodeId !== null,
        perform: () => selectNode(null, null),
      },
      {
        id: "center-canvas",
        label: "Center Canvas",
        keywords: ["center", "reset", "viewport", "home"],
        group: "canvas",
        shortcut: ["Shift", "C"],
        contexts: ["canvas"],
        perform: () => {
          void fitCanvasView();
        },
      },
      {
        id: "focus-blocked-task",
        label: "Focus Blocked Task",
        keywords: ["blocked", "cascade", "risk", "focus"],
        group: "canvas",
        contexts: ["blocked-task-selected"],
        isVisible: () => getSelectedTask()?.status === "blocked",
        perform: () => {
          if (selectedNodeId) void focusCanvasNode(selectedNodeId);
        },
      },
      {
        id: "new-task",
        label: "New Task",
        keywords: ["create", "task", "add", "new"],
        group: "tasks",
        shortcut: ["T"],
        contexts: ["global", "canvas"],
        perform: () => {
          const graph = queryClient.getQueryData<OrgGraphResponse>([
            "org-graph",
            ORG_ID,
          ]);
          const selected = getSelectedTask();
          let projectId = graph?.projects[0]?.id ?? "";
          let phaseId =
            graph?.phases.find((p) => p.projectId === projectId)?.id ?? "";
          if (selected) {
            projectId = selected.projectId;
            phaseId = selected.phaseId;
          }
          if (!projectId || !phaseId) return;
          openTaskCreate({ projectId, phaseId });
        },
      },
      {
        id: "edit-selected-task",
        label: "Edit Selected Task",
        keywords: ["edit", "task", "update"],
        group: "tasks",
        shortcut: ["E"],
        contexts: ["canvas"],
        isVisible: () => selectedNodeType === "task" && selectedNodeId !== null,
        perform: () => openTaskEdit(),
      },
      {
        id: "log-current-state",
        label: "Log Current Canvas State",
        keywords: ["debug", "state", "log", "inspect"],
        group: "debug",
        shortcut: ["Shift", "L"],
        contexts: ["global"],
        perform: () => {
          console.info("[FlowCanvas] Canvas state", {
            selectedNodeId,
            activeLayer,
            activeView,
            zoomLevel,
          });
        },
      },
    ];

    return commands;
  }, [
    setActiveView,
    openCommandPalette,
    closeCommandPalette,
    isCommandPaletteOpen,
    isRightPanelOpen,
    toggleRightPanel,
    closeRightPanel,
    openTaskCreate,
    openTaskEdit,
    queryClient,
    selectNode,
    nodes,
    selectedNodeId,
    selectedNodeType,
    activeLayer,
    zoomLevel,
    activeView,
    toggleWorkloadLayer,
  ]);
}
