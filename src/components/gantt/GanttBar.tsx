"use client";

import type { GanttBar as GanttBarData } from "@/lib/gantt/ganttUtils";

interface GanttBarProps {
  bar: GanttBarData;
  columnWidth: number;
  rowHeight: number;
  originDate: Date;
  onClick: (taskId: string) => void;
}

const STATUS_BAR_CLASS: Record<string, string> = {
  critical_path:
    "bg-[#E8AF34]/80 border border-[#E8AF34]/40",
  blocked: "bg-error/40 border border-error/60 border-dashed",
  in_progress: "bg-primary/50 border border-primary/40",
  in_review: "bg-violet-500/40 border border-violet-400/40",
  done: "bg-surface-container-high border border-white/10 opacity-60",
  not_started: "bg-surface-container border border-white/10",
};

function barClass(bar: GanttBarData): string {
  if (bar.isCriticalPath) return STATUS_BAR_CLASS.critical_path;
  return STATUS_BAR_CLASS[bar.status] ?? STATUS_BAR_CLASS.not_started;
}

function isDueOverdue(bar: GanttBarData, originDate: Date): boolean {
  if (bar.dueDateDay === null || bar.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const origin = new Date(originDate);
  origin.setHours(0, 0, 0, 0);
  const todayDay = Math.round(
    (today.getTime() - origin.getTime()) / (1000 * 60 * 60 * 24),
  );
  return bar.dueDateDay < todayDay;
}

export function GanttBar({
  bar,
  columnWidth,
  rowHeight,
  originDate,
  onClick,
}: GanttBarProps) {
  const width = bar.durationDays * columnWidth;
  const left = bar.startDay * columnWidth;
  const height = rowHeight - 12;
  const showLabel = width > 80;
  const overdue = isDueOverdue(bar, originDate);
  const visibleInitials = bar.assigneeInitials.slice(0, 2);
  const overflow = bar.assigneeInitials.length - visibleInitials.length;

  return (
    <div
      className="relative"
      style={{ height: rowHeight }}
    >
      <button
        type="button"
        onClick={() => onClick(bar.taskId)}
        className={`absolute top-1.5 flex items-center overflow-hidden rounded-md ${barClass(bar)}`}
        style={{ left, width, height }}
        aria-label={bar.title}
      >
        {showLabel ? (
          <span className="truncate px-2 text-[10px] font-medium text-on-surface">
            {bar.title}
          </span>
        ) : null}
      </button>

      {bar.dueDateDay !== null ? (
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[10px] ${
            overdue ? "text-error" : "text-on-surface-variant"
          }`}
          style={{ left: bar.dueDateDay * columnWidth - 4 }}
          aria-hidden
        >
          ◆
        </span>
      ) : null}

      {visibleInitials.length > 0 ? (
        <div
          className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5"
          style={{ left: left + width - 8 }}
        >
          {visibleInitials.map((initial) => (
            <span
              key={initial}
              className="rounded-full border border-white/10 bg-surface-container-highest px-1 text-[9px] font-medium text-on-surface-variant"
            >
              {initial}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="text-[9px] text-outline">+{overflow}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
