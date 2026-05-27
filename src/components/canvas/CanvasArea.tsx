"use client";

import { CanvasWrapper } from "./CanvasWrapper";
import { CascadePanel } from "@/components/panels/CascadePanel";
import { WorkloadBanner } from "./WorkloadBanner";
import { CanvasLoadingOverlay } from "./CanvasLoadingOverlay";
import { useViewportPersistence } from "@/lib/api/useViewportPersistence";
import { useUIStore } from "@/stores/ui.store";

function ViewportPersistenceBridge() {
  const isCanvasLoading = useUIStore((s) => s.isCanvasLoading);
  const canvasError = useUIStore((s) => s.canvasError);
  const graphReady = !isCanvasLoading && !canvasError;
  useViewportPersistence(graphReady);
  return null;
}

export function CanvasArea() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <CanvasWrapper />
      <ViewportPersistenceBridge />
      <CanvasLoadingOverlay />
      <CascadePanel />
      <WorkloadBanner />
    </div>
  );
}
