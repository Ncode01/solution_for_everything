"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

export function useDetailPanel() {
  const isOpen = useUIStore((s) => s.isRightPanelOpen);
  const mode = useUIStore((s) => s.rightPanelMode);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const selectNode = useCanvasStore((s) => s.selectNode);

  const close = useCallback(() => {
    closeRightPanel();
    selectNode(null, null);
  }, [closeRightPanel, selectNode]);

  return {
    isOpen,
    mode,
    selectedNodeId,
    selectedNodeType,
    close,
    openTaskView,
    openTaskEdit,
    openTaskCreate,
  };
}
