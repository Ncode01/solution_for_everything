"use client";

import { getTodayDayIndex } from "@/lib/gantt/ganttDateUtils";

interface GanttTodayLineProps {
  originDate: Date;
  columnWidth: number;
  totalDays: number;
  height: number;
}

export function GanttTodayLine({
  originDate,
  columnWidth,
  totalDays,
  height,
}: GanttTodayLineProps) {
  const todayDay = getTodayDayIndex(originDate);
  if (todayDay < 0 || todayDay > totalDays) return null;

  const left = todayDay * columnWidth;

  return (
    <div
      className="pointer-events-none absolute top-0 z-20"
      style={{ left, height }}
      aria-hidden
    >
      <span className="font-mono-label absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#DD6974]">
        Today
      </span>
      <div className="h-full w-px bg-[#DD6974]/70" />
    </div>
  );
}
