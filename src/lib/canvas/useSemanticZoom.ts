"use client";

import { useEffect, useRef } from "react";
import { useViewport } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { logDevOnce } from "@/lib/diagnostics";
import type { ZoomLevel } from "@/types";

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.3) return "Z0";
  if (zoom < 0.7) return "Z1";
  if (zoom < 1.5) return "Z2";
  return "Z3";
}

/**
 * Tracks the current zoom level for informational purposes only.
 * Does NOT hide or show any nodes — all nodes are always visible.
 * Node visibility is controlled exclusively by useProjectExpand
 * (person nodes) and explicit hidden flags set during graph build.
 */
export function useSemanticZoom() {
  const { zoom } = useViewport();
  const setZoomLevel = useCanvasStore((s) => s.setZoomLevel);
  const prevLevel = useRef<ZoomLevel | null>(null);

  useEffect(() => {
    const newLevel = getZoomLevel(zoom);
    if (newLevel === prevLevel.current) return;
    prevLevel.current = newLevel;
    setZoomLevel(newLevel);
    logDevOnce(
      `semantic-zoom-${newLevel}`,
      `[Canvas] zoom level: ${newLevel} (zoom=${zoom.toFixed(2)})`,
    );
  }, [zoom, setZoomLevel]);
}
