"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BarChart2 } from "lucide-react";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatQueryError } from "@/lib/formatQueryError";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import {
  buildGanttData,
  type GanttZoomLevel,
} from "@/lib/gantt/ganttUtils";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { GanttRuler } from "@/components/gantt/GanttRuler";
import { GanttRowGroup } from "@/components/gantt/GanttRowGroup";

const COLUMN_WIDTHS: Record<GanttZoomLevel, number> = {
  week: 40,
  month: 20,
  quarter: 10,
};

const ROW_HEIGHT = 44;
const LABEL_WIDTH = 240;

export function GanttView() {
  const query = useOrgGraphData();
  const [zoomLevel, setZoomLevel] = useState<GanttZoomLevel>("week");
  const scrollRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);

  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

  const columnWidth = COLUMN_WIDTHS[zoomLevel];

  const { groups, totalDays, originDate, taskCount } = useMemo(() => {
    if (!query.data) {
      return {
        groups: [],
        totalDays: 30,
        originDate: new Date(),
        taskCount: 0,
      };
    }
    const built = buildGanttData(query.data, zoomLevel);
    const count = built.groups.reduce((n, g) => n + g.bars.length, 0);
    return { ...built, taskCount: count };
  }, [query.data, zoomLevel]);

  const timelineWidth = totalDays * columnWidth;

  const handleBarClick = useCallback(
    (taskId: string) => {
      selectNode(`task-${taskId}`, "task");
      openTaskView();
    },
    [selectNode, openTaskView],
  );

  const syncScroll = useCallback((source: HTMLDivElement) => {
    const left = source.scrollLeft;
    if (rulerScrollRef.current && rulerScrollRef.current !== source) {
      rulerScrollRef.current.scrollLeft = left;
    }
    if (scrollRef.current && scrollRef.current !== source) {
      scrollRef.current.scrollLeft = left;
    }
  }, []);

  const scrollToToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const origin = new Date(originDate);
    origin.setHours(0, 0, 0, 0);
    const todayDay = Math.round(
      (today.getTime() - origin.getTime()) / (1000 * 60 * 60 * 24),
    );
    const target = Math.max(0, todayDay * columnWidth - 200);
    if (scrollRef.current) scrollRef.current.scrollLeft = target;
    if (rulerScrollRef.current) rulerScrollRef.current.scrollLeft = target;
  }, [originDate, columnWidth]);

  if (query.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (query.isLoading) {
    return (
      <main className="flex min-w-0 flex-1 flex-col bg-surface-container-low">
        <div className="flex flex-col gap-2 p-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[44px] animate-pulse rounded-lg bg-surface-container-high"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!query.data || groups.length === 0) {
    const hasTasks = (query.data?.tasks.length ?? 0) > 0;
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-surface-container-low p-6 text-center">
        <BarChart2 className="text-outline" size={32} aria-hidden />
        <p className="text-body-md text-on-surface">
          {hasTasks ? "No schedulable tasks" : "No tasks yet"}
        </p>
        <p className="text-body-sm max-w-sm text-on-surface-variant">
          {hasTasks
            ? "Gantt shows tasks with schedule data from CPM. Add due dates or dependencies on the canvas."
            : "Create tasks on the canvas to build a timeline."}
        </p>
        <button
          type="button"
          onClick={() => useUIStore.getState().setActiveView("canvas")}
          className="text-body-sm mt-2 rounded-lg border border-white/10 px-4 py-2 text-on-surface hover:bg-white/5"
        >
          Open canvas
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-container-low">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-3">
        <h1 className="text-headline-sm font-medium text-on-surface">Gantt</h1>
        <div className="flex gap-1">
          {(["week", "month", "quarter"] as const).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoomLevel(z)}
              className={
                zoomLevel === z
                  ? "font-mono-label rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs text-primary capitalize"
                  : "font-mono-label rounded-full border border-white/10 bg-transparent px-3 py-1 text-xs text-on-surface-variant capitalize"
              }
            >
              {z}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={scrollToToday}
          className="text-body-sm rounded-lg border border-white/10 px-3 py-1 text-on-surface-variant hover:bg-white/5"
        >
          Today
        </button>
        <span className="font-mono-label ml-auto rounded-full border border-white/10 px-3 py-1 text-mono-label text-on-surface-variant">
          {taskCount} tasks
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 border-b border-white/5">
          <div
            className="sticky left-0 z-20 shrink-0 border-r border-white/[0.08] bg-surface-container-low"
            style={{ width: LABEL_WIDTH }}
          />
          <div
            ref={rulerScrollRef}
            className="hide-scrollbar min-w-0 flex-1 overflow-x-auto"
            onScroll={(e) => syncScroll(e.currentTarget)}
          >
            <GanttRuler
              totalDays={totalDays}
              originDate={originDate}
              zoomLevel={zoomLevel}
              columnWidth={columnWidth}
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          className="hide-scrollbar min-h-0 flex-1 overflow-auto"
          onScroll={(e) => syncScroll(e.currentTarget)}
        >
          <div style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
            {groups.map((group) => (
              <GanttRowGroup
                key={group.phaseId}
                group={group}
                columnWidth={columnWidth}
                rowHeight={ROW_HEIGHT}
                totalDays={totalDays}
                originDate={originDate}
                zoomLevel={zoomLevel}
                onBarClick={handleBarClick}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
