"use client";

import React, { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { ProjectClusterNodeData } from "@/types";
import { useCanvasStore } from "@/stores/canvas.store";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  planning: "#4f4f4d",
  active: "#5591C7",
  on_hold: "#E8AF34",
  completed: "#6DAA45",
};

export const ProjectClusterNode = React.memo(function ProjectClusterNode({
  data,
}: NodeProps) {
  const nodeData = data as ProjectClusterNodeData;
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const isZ1 = zoomLevel === "Z1";

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      nodeData.onToggleExpand(nodeData.project.id);
    },
    [nodeData],
  );

  const accentColor = COLOR_MAP[nodeData.project.color] ?? "#5591C7";
  const phaseCount = nodeData.project.phases.length;
  const taskCount = nodeData.project.phases.reduce(
    (sum, ph) => sum + ph.taskCount,
    0,
  );

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-white/[0.06] bg-surface-container",
        isZ1 ? "w-[240px] py-4 pl-5 pr-3" : "h-[72px] w-[180px]",
      ].join(" ")}
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className={`flex h-full flex-col ${isZ1 ? "" : "py-3 pl-5 pr-3"}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-headline-sm truncate font-semibold text-on-surface">
            {nodeData.project.name}
          </p>
          {isZ1 ? (
            <button
              type="button"
              onClick={handleToggle}
              className="shrink-0 text-on-surface-variant transition-transform duration-150 hover:text-on-surface"
              aria-label={
                nodeData.isExpanded ? "Collapse project" : "Expand project"
              }
            >
              <ChevronRight
                size={16}
                className={[
                  "transition-transform duration-150",
                  nodeData.isExpanded ? "rotate-90" : "",
                ].join(" ")}
              />
            </button>
          ) : (
            <span className="font-mono-label shrink-0 text-[10px] text-on-surface-variant">
              {nodeData.project.completionPercent}%
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: STATUS_DOT_COLOR[nodeData.project.status],
            }}
          />
          <span className="text-body-sm capitalize text-on-surface-variant">
            {nodeData.project.status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${nodeData.project.completionPercent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>

        {isZ1 && (
          <p className="font-mono-label mt-2 text-[10px] text-on-surface-variant">
            {phaseCount} phases · {taskCount} tasks
          </p>
        )}

        {!isZ1 && (
          <span className="font-mono-label absolute right-3 top-3 text-[10px] text-on-surface-variant">
            {nodeData.project.completionPercent}%
          </span>
        )}
      </div>
    </div>
  );
});
