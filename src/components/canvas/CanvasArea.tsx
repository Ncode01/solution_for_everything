"use client";

import { Workflow } from "lucide-react";
import { CanvasWrapper } from "./CanvasWrapper";
import { CascadePanel } from "@/components/panels/CascadePanel";
import { WorkloadBanner } from "./WorkloadBanner";
import { CanvasLoadingOverlay } from "./CanvasLoadingOverlay";
import { useViewportPersistence } from "@/lib/api/useViewportPersistence";
import { useUIStore } from "@/stores/ui.store";
import { useCanvasStore } from "@/stores/canvas.store";

function ViewportPersistenceBridge() {
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const graphReady = !isCanvasLoading && !canvasError;
  useViewportPersistence(graphReady);
  return null;
}

export function CanvasArea() {
  const nodes = useCanvasStore((s) => s.nodes);
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const taskNodeCount = nodes.filter((n) => n.id.startsWith("task-")).length;
  const showEmpty =
    !isCanvasLoading && !canvasError && taskNodeCount === 0;

  return (
    <div className="relative flex-1 overflow-hidden">
      <CanvasWrapper />
      <ViewportPersistenceBridge />
      <CanvasLoadingOverlay />
      {showEmpty ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Workflow className="text-outline" size={36} />
          <p className="text-body-md font-medium text-on-surface">
            No tasks yet
          </p>
          <p className="text-body-sm text-on-surface-variant">
            Press T to create your first task
          </p>
        </div>
      ) : null}
      <CascadePanel />
      <WorkloadBanner />
    </div>
  );
}
