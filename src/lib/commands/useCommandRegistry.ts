"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { logDeadEndOnce } from "@/lib/diagnostics";
import type { OrgGraphResponse } from "@/lib/api/types";
import { getEffectiveOrgId } from "@/lib/api/orgId";
import { useWorkloadLayer } from "@/lib/canvas/useWorkloadLayer";
import { fitCanvasView, focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import type { CommandDefinition } from "@/types/commands";
import type { TaskCardNodeData } from "@/types";

export function useCommandRegistry(): CommandDefinition[] {
  const queryClient = useQueryClient();
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const isCommandPaletteOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const selectNode = useCanvasStore((s) => s.selectNode);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const toggleMinimap = useCanvasStore((s) => s.toggleMinimap);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const activeView = useUIStore((s) => s.activeView);

  const { toggleWorkloadLayer } = useWorkloadLayer();

  return useMemo(() => {
    const orgId = getEffectiveOrgId();

    const getGraph = () =>
      queryClient.getQueryData<OrgGraphResponse>(["org-graph", orgId]);

    const getSelectedTask = () => {
      if (selectedNodeType !== "task" || !selectedNodeId) return null;
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (!node) return null;
      return (node.data as TaskCardNodeData).task;
    };

    const navigateCanvasToNode = (nodeId: string) => {
      setActiveView("canvas");
      setTimeout(() => void focusCanvasNode(nodeId), 80);
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
        id: "open-tasks-view",
        label: "Open All Tasks",
        keywords: ["tasks", "list", "table"],
        group: "navigation",
        contexts: ["global"],
        perform: () => setActiveView("tasks"),
      },
      {
        id: "open-posters-view",
        label: "Open Poster Board",
        keywords: ["posters", "board", "images"],
        group: "navigation",
        contexts: ["global"],
        perform: () => setActiveView("posters"),
      },
      {
        id: "open-schools-view",
        label: "Open Network Schools",
        keywords: ["schools", "network", "education"],
        group: "navigation",
        contexts: ["global"],
        perform: () => setActiveView("schools"),
      },
      {
        id: "open-team-view",
        label: "Open Team",
        keywords: ["team", "people", "members"],
        group: "navigation",
        contexts: ["global"],
        perform: () => setActiveView("team"),
      },
      {
        id: "open-budget-view",
        label: "Open Budget",
        keywords: ["budget", "finance", "money"],
        group: "navigation",
        contexts: ["global"],
        perform: () => setActiveView("budget"),
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
        label: "Toggle Workload Layer",
        keywords: ["workload", "heatmap", "capacity", "people", "layer"],
        group: "view",
        shortcut: ["Shift", "W"],
        contexts: ["global", "canvas"],
        perform: () => toggleWorkloadLayer(),
      },
      {
        id: "toggle-default-layer",
        label: "Switch to Default Layer",
        keywords: ["layer", "default", "all", "tasks"],
        group: "view",
        contexts: ["global", "canvas", "workload-active"],
        isVisible: () => activeLayer !== "default",
        perform: () => setActiveLayer("default"),
      },
      {
        id: "toggle-critical-path-layer",
        label: "Toggle Critical Path Layer",
        keywords: ["critical", "path", "cpm", "layer"],
        group: "view",
        contexts: ["global", "canvas"],
        perform: () =>
          setActiveLayer(
            activeLayer === "criticalPath" ? "default" : "criticalPath",
          ),
      },
      {
        id: "toggle-minimap",
        label: "Toggle Minimap",
        keywords: ["minimap", "overview", "map"],
        group: "view",
        contexts: ["canvas"],
        perform: () => toggleMinimap(),
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
        id: "fit-canvas-view",
        label: "Zoom to Fit",
        keywords: ["fit", "zoom", "viewport", "center", "home"],
        group: "canvas",
        shortcut: ["Shift", "C"],
        contexts: ["canvas"],
        perform: () => {
          void fitCanvasView();
        },
      },
      {
        id: "center-canvas",
        label: "Center Canvas",
        keywords: ["center", "reset", "viewport"],
        group: "canvas",
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
        id: "focus-selected-task",
        label: "Go to Selected Task on Canvas",
        keywords: ["focus", "task", "navigate"],
        group: "canvas",
        contexts: ["canvas"],
        isVisible: () => selectedNodeType === "task" && selectedNodeId !== null,
        perform: () => {
          if (selectedNodeId) navigateCanvasToNode(selectedNodeId);
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
          const graph = getGraph();
          const selected = getSelectedTask();
          let projectId = graph?.projects[0]?.id ?? "";
          let phaseId =
            graph?.phases.find((p) => p.projectId === projectId)?.id ?? "";
          if (selected) {
            projectId = selected.projectId;
            phaseId = selected.phaseId;
          }
          if (!projectId || !phaseId) {
            useUIStore
              .getState()
              .addToast(
                "error",
                "Create a project and phase before adding tasks.",
              );
            logDeadEndOnce(
              "new-task-no-project",
              "new-task command blocked: no project or phase in org graph",
            );
            return;
          }
          openTaskCreate({ projectId, phaseId });
        },
      },
      {
        id: "new-milestone",
        label: "New Milestone",
        keywords: ["milestone", "create", "flag"],
        group: "tasks",
        contexts: ["global", "canvas"],
        perform: () => {
          logDeadEndOnce(
            "new-milestone-cmd",
            "[Command] New milestone — use project detail panel",
          );
          useUIStore
            .getState()
            .addToast("error", "Create milestones from the project panel.");
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
        isVisible: () => process.env.NODE_ENV !== "production",
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
    closeRightPanel,
    openTaskCreate,
    openTaskEdit,
    queryClient,
    selectNode,
    setActiveLayer,
    toggleMinimap,
    nodes,
    selectedNodeId,
    selectedNodeType,
    activeLayer,
    zoomLevel,
    activeView,
    toggleWorkloadLayer,
  ]);
}
