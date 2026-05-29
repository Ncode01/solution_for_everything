"use client";

import type { GanttZoomLevel } from "@/lib/gantt/ganttUtils";
import { getTodayDayIndex } from "@/lib/gantt/ganttDateUtils";

interface GanttRulerProps {
  totalDays: number;
  originDate: Date;
  zoomLevel: GanttZoomLevel;
  columnWidth: number;
}

function tickInterval(zoom: GanttZoomLevel): number {
  if (zoom === "week") return 1;
  if (zoom === "month") return 7;
  return 14;
}

function labelInterval(zoom: GanttZoomLevel): number {
  if (zoom === "week") return 7;
  return 30;
}

function formatLabel(origin: Date, dayIndex: number): string {
  const d = new Date(origin);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GanttRuler({
  totalDays,
  originDate,
  zoomLevel,
  columnWidth,
}: GanttRulerProps) {
  const tickEvery = tickInterval(zoomLevel);
  const labelEvery = labelInterval(zoomLevel);
  const todayDay = getTodayDayIndex(originDate);

  const ticks: number[] = [];
  for (let d = 0; d <= totalDays; d += tickEvery) {
    ticks.push(d);
  }

  const width = totalDays * columnWidth;

  return (
    <div
      className="relative h-10 shrink-0 border-b border-white/5 bg-surface-container-low"
      style={{ width }}
    >
      {ticks.map((day) => (
        <div
          key={`tick-${day}`}
          className="absolute top-0 bottom-0 border-l border-white/[0.04]"
          style={{ left: day * columnWidth }}
        />
      ))}

      {todayDay >= 0 && todayDay <= totalDays ? (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10"
          style={{ left: todayDay * columnWidth }}
          aria-hidden
        >
          <span className="font-mono-label absolute top-1 left-1 text-[10px] text-[#DD6974]">
            Today
          </span>
          <div className="h-full w-px bg-[#DD6974]/70" />
        </div>
      ) : null}

      {ticks
        .filter((day) => day % labelEvery === 0)
        .map((day) => (
          <span
            key={`label-${day}`}
            className="font-mono-label absolute top-2 text-[10px] text-on-surface-variant"
            style={{ left: day * columnWidth + 4 }}
          >
            {formatLabel(originDate, day)}
          </span>
        ))}
    </div>
  );
}
