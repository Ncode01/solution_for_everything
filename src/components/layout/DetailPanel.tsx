"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { shellVariants, colors, typography, buttonVariants } from "@/design-system";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { TaskDetailPanel } from "@/components/panels/TaskDetailPanel";
import { ProjectDetailPanel } from "@/components/panels/ProjectDetailPanel";
import { PersonDetailPanel } from "@/components/panels/PersonDetailPanel";

export function DetailPanel() {
  const { isOpen, selectedNodeId, selectedNodeType, close } = useDetailPanel();

  const rightPanelMode = useUIStore((s) => s.rightPanelMode);

  const showProjectPanel = selectedNodeType === "project" && selectedNodeId;
  const showPersonPanel = selectedNodeType === "person" && selectedNodeId;
  const showTaskPanel =
    !showProjectPanel &&
    !showPersonPanel &&
    isOpen &&
    (rightPanelMode === "task-create" ||
      rightPanelMode === "task-edit" ||
      (rightPanelMode === "task-view" &&
        selectedNodeType === "task" &&
        selectedNodeId));

  const showPanel = showTaskPanel || showProjectPanel || showPersonPanel;

  return (
    <AnimatePresence mode="wait">
      {showPanel ? (
        <motion.aside
          key="detail-panel"
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={shellVariants.detailPanel}
          aria-label="Detail panel"
        >
          <header
            className={`flex h-16 shrink-0 items-center justify-between border-b px-4 ${colors.border.subtle}`}
          >
            <div className="min-w-0 flex-1">
              <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
                {entityBreadcrumb(selectedNodeType)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={close}
                className={buttonVariants.icon}
                aria-label="Close panel (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </header>
          <div className="hide-scrollbar flex-1 overflow-y-auto">
            {showTaskPanel && <TaskDetailPanel />}
            {showProjectPanel && <ProjectDetailPanel />}
            {showPersonPanel && <PersonDetailPanel />}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function entityBreadcrumb(
  type: ReturnType<typeof useCanvasStore.getState>["selectedNodeType"],
): string {
  switch (type) {
    case "project":
      return "Project";
    case "task":
      return "Task";
    case "person":
      return "Person";
    case "phase":
      return "Phase";
    default:
      return "Details";
  }
}
