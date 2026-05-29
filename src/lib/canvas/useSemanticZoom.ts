"use client";

import { useEffect, useRef } from "react";
import { useViewport } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { logDevOnce } from "@/lib/diagnostics";
import type { ZoomLevel } from "@/types";
import type { Node } from "@xyflow/react";

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.3) return "Z0";
  if (zoom < 0.7) return "Z1";
  if (zoom < 1.5) return "Z2";
  return "Z3";
}

function hiddenStyle(): Node["style"] {
  return { opacity: 0, pointerEvents: "none" };
}

function visibleStyle(): Node["style"] {
  return { opacity: 1, pointerEvents: "auto" };
}

function applyZoomVisibility(nodes: Node[], zoom: number): Node[] {
  return nodes.map((node) => {
    const base = { ...node, style: { ...node.style, ...visibleStyle() } };

    if (zoom < 0.15) {
      if (node.type === "projectCluster") return base;
      return { ...node, style: { ...node.style, ...hiddenStyle() } };
    }

    if (zoom < 0.4) {
      if (
        node.type === "projectCluster" ||
        node.type === "milestoneNode"
      ) {
        return base;
      }
      return { ...node, style: { ...node.style, ...hiddenStyle() } };
    }

    if (zoom > 1.5) {
      if (node.type === "taskCard") {
        return {
          ...node,
          style: visibleStyle(),
          data: { ...node.data, detailed: true },
        };
      }
      if (node.type === "phaseHeader") {
        return {
          ...node,
          style: visibleStyle(),
          data: { ...node.data, showTaskCount: true },
        };
      }
    }

    if (node.type === "taskCard") {
      return {
        ...node,
        style: visibleStyle(),
        data: { ...node.data, detailed: false },
      };
    }

    return base;
  });
}

/**
 * Applies semantic zoom visibility and detail levels via node style/data updates.
 */
export function useSemanticZoom() {
  const { zoom } = useViewport();
  const setZoomLevel = useCanvasStore((s) => s.setZoomLevel);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const prevLevel = useRef<ZoomLevel | null>(null);
  const prevZoomBand = useRef<string | null>(null);

  useEffect(() => {
    const newLevel = getZoomLevel(zoom);
    if (newLevel !== prevLevel.current) {
      prevLevel.current = newLevel;
      setZoomLevel(newLevel);
      logDevOnce(
        `semantic-zoom-${newLevel}`,
        `[Canvas] zoom level: ${newLevel} (zoom=${zoom.toFixed(2)})`,
      );
    }

    const band =
      zoom < 0.15
        ? "overview"
        : zoom < 0.4
          ? "project"
          : zoom > 1.5
            ? "detail"
            : "task";
    if (band === prevZoomBand.current) return;
    prevZoomBand.current = band;

    setNodes((nodes) => applyZoomVisibility(nodes, zoom));
  }, [zoom, setZoomLevel, setNodes]);
}
