"use client";

import { Workflow } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CanvasWrapper } from "./CanvasWrapper";
import { CascadePanel } from "@/components/panels/CascadePanel";
import { WorkloadBanner } from "./WorkloadBanner";
import { CanvasLoadingOverlay } from "./CanvasLoadingOverlay";
import { useViewportPersistence } from "@/lib/api/useViewportPersistence";
import type { OrgGraphResponse } from "@/lib/api/types";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

function ViewportPersistenceBridge() {
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const graphReady = !isCanvasLoading && !canvasError;
  useViewportPersistence(graphReady);
  return null;
}

export function CanvasArea() {
  const queryClient = useQueryClient();
  const nodes = useCanvasStore((s) => s.nodes);
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const taskNodeCount = nodes.filter((n) => n.id.startsWith("task-")).length;
  const showEmpty =
    !isCanvasLoading && !canvasError && taskNodeCount === 0;

  const handleCreateFirstTask = () => {
    const graph = queryClient.getQueryData<OrgGraphResponse>([
      "org-graph",
      ORG_ID,
    ]);
    const project = graph?.projects[0];
    const phase = graph?.phases.find((p) => p.projectId === project?.id);
    if (!project || !phase) {
      useUIStore
        .getState()
        .addToast(
          "error",
          "No project or phase available. Check org setup and try again.",
        );
      return;
    }
    openTaskCreate({ projectId: project.id, phaseId: phase.id });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <CanvasWrapper />
      <ViewportPersistenceBridge />
      <CanvasLoadingOverlay />
      {showEmpty ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <Workflow className="text-outline" size={36} aria-hidden />
          <p className="text-body-md font-medium text-on-surface">
            No tasks yet
          </p>
          <p className="text-body-sm text-on-surface-variant">
            Create a task to get started, or press{" "}
            <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px]">
              T
            </kbd>
          </p>
          <button
            type="button"
            onClick={handleCreateFirstTask}
            className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary"
          >
            Create task
          </button>
        </div>
      ) : null}
      <CascadePanel />
      <WorkloadBanner />
    </div>
  );
}
