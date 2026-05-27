"use client";

import { GitFork } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { TaskDetailPanel } from "@/components/panels/TaskDetailPanel";

export function RightPanel() {
  const isOpen = useUIStore((s) => s.isRightPanelOpen);
  const rightPanelMode = useUIStore((s) => s.rightPanelMode);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);

  const showPanel =
    isOpen &&
    (rightPanelMode === "task-create" ||
      rightPanelMode === "task-edit" ||
      (rightPanelMode === "task-view" && selectedNodeId));

  return (
    <aside
      className={[
        "flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-surface-container transition-all duration-200",
        showPanel
          ? "translate-x-0"
          : "pointer-events-none w-0 translate-x-full opacity-0",
      ].join(" ")}
      aria-hidden={!showPanel}
    >
      {rightPanelMode === "task-create" || rightPanelMode === "task-edit" ? (
        <TaskDetailPanel />
      ) : selectedNodeId ? (
        <TaskDetailPanel />
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <GitFork size={40} className="mb-4 text-outline" strokeWidth={1.25} />
          <p className="text-body-md text-on-surface-variant">
            Select a node to inspect
          </p>
          <p className="text-body-sm mt-1 text-outline">
            or press T to create a new task
          </p>
        </div>
      )}
    </aside>
  );
}
