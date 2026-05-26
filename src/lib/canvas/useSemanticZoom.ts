import { useEffect } from "react";
import { useViewport } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import type { ZoomLevel } from "@/types";

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.3) return "Z0";
  if (zoom < 0.7) return "Z1";
  if (zoom < 1.5) return "Z2";
  return "Z3";
}

export function useSemanticZoom() {
  const { zoom } = useViewport();
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const setZoomLevel = useCanvasStore((s) => s.setZoomLevel);

  useEffect(() => {
    const newLevel = getZoomLevel(zoom);
    if (newLevel === zoomLevel) return;
    setZoomLevel(newLevel);
    // Phase 2: toggle node.hidden per zoom level
  }, [zoom, zoomLevel, setZoomLevel]);
}
