"use client";

import type { GanttPhaseGroup } from "@/lib/gantt/ganttUtils";
import type { GanttZoomLevel } from "@/lib/gantt/ganttUtils";
import { GanttBar } from "./GanttBar";

interface GanttRowGroupProps {
  group: GanttPhaseGroup;
  columnWidth: number;
  rowHeight: number;
  totalDays: number;
  originDate: Date;
  zoomLevel: GanttZoomLevel;
  onBarClick: (taskId: string) => void;
}

function tickInterval(zoom: GanttZoomLevel): number {
  if (zoom === "week") return 1;
  if (zoom === "month") return 7;
  return 14;
}

export function GanttRowGroup({
  group,
  columnWidth,
  rowHeight,
  totalDays,
  originDate,
  zoomLevel,
  onBarClick,
}: GanttRowGroupProps) {
  const tickEvery = tickInterval(zoomLevel);
  const gridTicks: number[] = [];
  for (let d = 0; d <= totalDays; d += tickEvery) {
    gridTicks.push(d);
  }

  const timelineWidth = totalDays * columnWidth;

  return (
    <div className="border-b border-white/5">
      <div className="flex">
        <div className="sticky left-0 z-10 flex h-8 w-[240px] shrink-0 items-center gap-2 border-r border-white/[0.08] bg-surface-container-low px-3">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: group.projectColor }}
          />
          <span className="text-body-sm truncate font-medium text-on-surface">
            {group.phaseName}
          </span>
          <span className="text-body-sm truncate text-outline">
            {group.projectName}
          </span>
          <span className="font-mono-label ml-auto shrink-0 text-mono-label text-outline">
            {group.bars.length}
          </span>
        </div>
        <div
          className="relative h-8 shrink-0"
          style={{ width: timelineWidth }}
        />
      </div>

      {group.bars.map((bar, index) => (
        <div
          key={bar.taskId}
          className={`flex ${index % 2 === 0 ? "bg-white/[0.01]" : ""}`}
        >
          <div className="sticky left-0 z-10 flex w-[240px] shrink-0 items-center border-r border-white/[0.08] bg-surface-container-low px-3">
            <span className="text-body-sm truncate text-on-surface-variant">
              {bar.title}
            </span>
          </div>
          <div
            className="relative shrink-0"
            style={{ width: timelineWidth }}
          >
            {gridTicks.map((day) => (
              <div
                key={`grid-${bar.taskId}-${day}`}
                className="pointer-events-none absolute top-0 bottom-0 border-l border-white/[0.04]"
                style={{ left: day * columnWidth }}
              />
            ))}
            <GanttBar
              bar={bar}
              columnWidth={columnWidth}
              rowHeight={rowHeight}
              originDate={originDate}
              onClick={onBarClick}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
