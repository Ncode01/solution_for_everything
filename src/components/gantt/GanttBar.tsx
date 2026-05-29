"use client";

import { useCallback, useRef, useState } from "react";
import type { GanttBar as GanttBarData } from "@/lib/gantt/ganttUtils";
import { formatGanttRange } from "@/lib/gantt/ganttDateUtils";

export interface GanttSchedulePatch {
  startDay: number;
  durationDays: number;
}

interface GanttBarProps {
  bar: GanttBarData;
  columnWidth: number;
  rowHeight: number;
  originDate: Date;
  onClick: (taskId: string) => void;
  onScheduleChange: (taskId: string, patch: GanttSchedulePatch) => void;
}

const STATUS_BAR_CLASS: Record<string, string> = {
  critical_path:
    "bg-[#E8AF34]/80 border border-[#E8AF34]/40",
  blocked: "bg-[#E8AF34]/10 border border-[#E8AF34]/60 border-dashed",
  in_progress: "bg-primary/50 border border-primary/40",
  in_review: "bg-[#A86FDF]/40 border border-[#A86FDF]/40",
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

type DragMode = "move" | "resize-end";

export function GanttBar({
  bar,
  columnWidth,
  rowHeight,
  originDate,
  onClick,
  onScheduleChange,
}: GanttBarProps) {
  const [preview, setPreview] = useState<GanttSchedulePatch | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    pointerId: number;
    originX: number;
    startDay: number;
    durationDays: number;
  } | null>(null);

  const startDay = preview?.startDay ?? bar.startDay;
  const durationDays = Math.max(1, preview?.durationDays ?? bar.durationDays);
  const width = durationDays * columnWidth;
  const left = startDay * columnWidth;
  const height = rowHeight - 12;
  const showLabel = width > 80;
  const overdue = isDueOverdue(bar, originDate);
  const visibleInitials = bar.assigneeInitials.slice(0, 2);
  const overflow = bar.assigneeInitials.length - visibleInitials.length;

  const snapDay = (px: number) =>
    Math.max(0, Math.round(px / columnWidth));

  const handlePointerDown = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        mode,
        pointerId: e.pointerId,
        originX: e.clientX,
        startDay: bar.startDay,
        durationDays: bar.durationDays,
      };
      setPreview({ startDay: bar.startDay, durationDays: bar.durationDays });
    },
    [bar.startDay, bar.durationDays],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const deltaPx = e.clientX - drag.originX;
      const deltaDays = snapDay(deltaPx);

      if (drag.mode === "move") {
        setPreview({
          startDay: Math.max(0, drag.startDay + deltaDays),
          durationDays: drag.durationDays,
        });
      } else {
        setPreview({
          startDay: drag.startDay,
          durationDays: Math.max(1, drag.durationDays + deltaDays),
        });
      }
    },
    [columnWidth],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

      const final = preview ?? {
        startDay: bar.startDay,
        durationDays: bar.durationDays,
      };
      setPreview(null);

      if (
        final.startDay !== bar.startDay ||
        final.durationDays !== bar.durationDays
      ) {
        onScheduleChange(bar.taskId, final);
      }
    },
    [bar, preview, onScheduleChange],
  );

  const handlePointerCancel = useCallback(() => {
    dragRef.current = null;
    setPreview(null);
  }, []);

  const tooltip =
    preview !== null
      ? formatGanttRange(originDate, startDay, durationDays)
      : null;

  return (
    <div className="relative" style={{ height: rowHeight }}>
      {tooltip ? (
        <div
          className="font-mono-label pointer-events-none absolute -top-7 z-30 rounded-md border border-white/10 bg-surface-container-highest px-2 py-0.5 text-[10px] text-on-surface"
          style={{ left }}
        >
          {tooltip}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!dragRef.current) onClick(bar.taskId);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(bar.taskId);
          }
        }}
        onPointerDown={handlePointerDown("move")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`absolute top-1.5 flex cursor-grab items-center overflow-hidden rounded-md active:cursor-grabbing ${barClass(bar)} ${
          bar.isCriticalPath ? "border-l-2 border-l-[#E8AF34]" : ""
        }`}
        style={{ left, width, height }}
        aria-label={bar.title}
      >
        {bar.isCriticalPath ? (
          <span className="font-mono-label absolute top-0.5 right-1 rounded bg-[#E8AF34]/30 px-1 text-[8px] font-medium text-[#E8AF34]">
            CP
          </span>
        ) : null}
        {showLabel ? (
          <span className="truncate px-2 text-body-sm font-medium text-on-surface">
            {bar.title}
          </span>
        ) : null}
      </div>

      <div
        className="absolute top-1.5 z-10 w-2 cursor-ew-resize rounded-r-md bg-white/20 hover:bg-white/40"
        style={{ left: left + width - 6, height }}
        onPointerDown={handlePointerDown("resize-end")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label={`Resize ${bar.title}`}
      />

      {bar.dueDateDay !== null ? (
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[10px] ${
            overdue ? "text-[#DD6974]" : "text-on-surface-variant"
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
