import { useEffect, useRef } from "react";
import { useViewport } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
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
  Z0: { show: ["project-"], hide: ["task-", "phase-", "person-"] },
  Z1: { show: ["project-", "phase-"], hide: ["task-", "person-"] },
  Z2: { show: ["task-"], hide: ["project-", "phase-", "person-"] },
  Z3: { show: ["task-"], hide: ["project-", "phase-", "person-"] },
};

export function useSemanticZoom() {
  const { zoom } = useViewport();
  const setZoomLevel = useCanvasStore((s) => s.setZoomLevel);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const prevLevel = useRef<ZoomLevel | null>(null);

  useEffect(() => {
    const newLevel = getZoomLevel(zoom);
    if (newLevel === prevLevel.current) return;
    prevLevel.current = newLevel;
    setZoomLevel(newLevel);

    const { show, hide } = VISIBILITY_RULES[newLevel];
    const isZ3 = newLevel === "Z3";

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id.startsWith("person-")) {
          return {
            ...node,
            hidden: activeLayer !== "workload",
          };
        }

        if (activeLayer === "workload" && node.id.startsWith("task-")) {
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
            data: {
              ...node.data,
              isExpanded: isZ3,
            } as TaskCardNodeData,
          };
        }

        return { ...node, hidden };
      }),
    );
  }, [zoom, setZoomLevel, setNodes, activeLayer]);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (!node.id.startsWith("person-")) return node;
        return { ...node, hidden: activeLayer !== "workload" };
      }),
    );
  }, [activeLayer, setNodes]);
}
