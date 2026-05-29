"use client";

import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { TaskDetailPanel } from "@/components/panels/TaskDetailPanel";
import { ProjectDetailPanel } from "@/components/panels/ProjectDetailPanel";
import { PersonDetailPanel } from "@/components/panels/PersonDetailPanel";

export function RightPanel() {
  const isOpen = useUIStore((s) => s.isRightPanelOpen);
  const rightPanelMode = useUIStore((s) => s.rightPanelMode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);

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
  const panelWidth =
    showProjectPanel ? "w-[380px]" : showPanel ? "w-[360px]" : "w-0";

  return (
    <aside
      className={[
        "flex shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-surface-container transition-transform duration-300",
        panelWidth,
        showPanel
          ? "translate-x-0"
          : "pointer-events-none translate-x-full opacity-0",
      ].join(" ")}
      aria-hidden={!showPanel}
    >
      {showTaskPanel && (
        <div className="h-full transition-transform duration-300">
          <TaskDetailPanel />
        </div>
      )}
      {showProjectPanel && (
        <div className="h-full transition-transform duration-300">
          <ProjectDetailPanel />
        </div>
      )}
      {showPersonPanel && (
        <div className="h-full transition-transform duration-300">
          <PersonDetailPanel />
        </div>
      )}
    </aside>
  );
}
