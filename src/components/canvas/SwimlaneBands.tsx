"use client";

import React from "react";
import { ViewportPortal } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { LAYOUT } from "@/lib/canvas/layout";
import type { ProjectClusterNodeData } from "@/types";

const PROJECT_BAND_HEIGHT =
  LAYOUT.TASK.BAND_OFFSET_Y +
  LAYOUT.TASK.TASKS_PER_COL * LAYOUT.TASK.TASK_ROW_HEIGHT +
  80;

function colorToBand(color: string): string {
  const map: Record<string, string> = {
    coral: "rgba(229, 115, 115, 0.04)",
    amber: "rgba(232, 175,  52, 0.04)",
    violet: "rgba(156, 126, 199, 0.04)",
    sky: "rgba( 85, 145, 199, 0.04)",
    mint: "rgba(109, 170,  69, 0.04)",
  };
  return map[color] ?? "rgba(255, 255, 255, 0.03)";
}

export const SwimlaneBands = React.memo(function SwimlaneBands() {
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const nodes = useCanvasStore((s) => s.nodes);

  if (zoomLevel !== "Z2" && zoomLevel !== "Z3") return null;

  const projectNodes = nodes.filter((n) => n.id.startsWith("project-"));

  return (
    <ViewportPortal>
      {projectNodes.map((pNode) => {
        const { x, y } = pNode.position;
        const color =
          (pNode.data as ProjectClusterNodeData).project.color ?? "sky";
        const bandColor = colorToBand(color);

        return (
          <div
            key={pNode.id}
            className="pointer-events-none absolute select-none"
            style={{
              left: x - 24,
              top: y + LAYOUT.TASK.BAND_OFFSET_Y - 24,
              width: LAYOUT.PROJECT.COL_WIDTH - 40,
              height: PROJECT_BAND_HEIGHT,
              background: bandColor,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        );
      })}
    </ViewportPortal>
  );
});
