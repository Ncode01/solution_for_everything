import { useEffect, useRef } from "react";
import { useViewport } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { logDevOnce } from "@/lib/diagnostics";
import type { TaskCardNodeData, ZoomLevel } from "@/types";

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.3) return "Z0";
  if (zoom < 0.7) return "Z1";
  if (zoom < 1.5) return "Z2";
  return "Z3";
}

const VISIBILITY_RULES: Record<
  ZoomLevel,
  { show: string[]; hide: string[] }
> = {
  Z0: {
    show: ["project-", "milestone-"],
    hide: ["task-", "phase-", "person-", "phase-header-"],
  },
  Z1: {
    show: ["project-", "phase-"],
    hide: ["task-", "person-", "phase-header-"],
  },
  Z2: {
    show: ["task-", "phase-header-"],
    hide: ["project-", "phase-", "person-"],
  },
  Z3: {
    show: ["task-", "phase-header-"],
    hide: ["project-", "phase-", "person-"],
  },
};

export function useSemanticZoom() {
  const { zoom } = useViewport();
  const setZoomLevel = useCanvasStore((s) => s.setZoomLevel);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const prevLevel = useRef<ZoomLevel | null>(null);
  const prevActiveLayer = useRef<string | null>(null);

  useEffect(() => {
    const newLevel = getZoomLevel(zoom);
    const sameLevel = newLevel === prevLevel.current;
    const sameLayer = activeLayer === prevActiveLayer.current;
    if (sameLevel && sameLayer) {
      logDevOnce(
        "semantic-zoom-skip",
        `[FlowCanvas] semantic zoom skipped: level and layer unchanged (${newLevel}, ${activeLayer})`,
      );
      return;
    }
    prevLevel.current = newLevel;
    prevActiveLayer.current = activeLayer;
    setZoomLevel(newLevel);

    const { show, hide } = VISIBILITY_RULES[newLevel];
    const isZ3 = newLevel === "Z3";
    const layer = activeLayer; // capture — do not close over reactive ref inside setNodes

    const showCrossEdges = newLevel === "Z0";

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id.startsWith("person-")) {
          return { ...node, hidden: layer !== "workload" };
        }
        if (layer === "workload" && node.id.startsWith("task-")) {
          return node;
        }
        let hidden = node.hidden ?? false;
        if (show.some((prefix) => node.id.startsWith(prefix))) {
          hidden = false;
        } else if (hide.some((prefix) => node.id.startsWith(prefix))) {
          hidden = true;
        }
        if (node.id.startsWith("task-") && node.data) {
          return {
            ...node,
            hidden,
            data: { ...node.data, isExpanded: isZ3 } as TaskCardNodeData,
          };
        }
        return { ...node, hidden };
      }),
    );

    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.type === "crossProject") {
          return { ...edge, hidden: !showCrossEdges };
        }
        return edge;
      }),
    );
  }, [zoom, activeLayer, setZoomLevel, setNodes, setEdges]);
}
