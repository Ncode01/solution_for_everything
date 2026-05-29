"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar } from "lucide-react";
import type { TaskCardNodeData } from "@/types";
import { accentHex } from "@/lib/canvas/node-colors";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

type GanttData = TaskCardNodeData & {
  ganttStartDate?: string | null;
  ganttEndDate?: string | null;
  ganttProgress?: number | null;
};

export const GanttMiniBarNode = React.memo(function GanttMiniBarNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as GanttData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const accent = accentHex(nodeData.projectColor);
  const progress = nodeData.ganttProgress ?? 0;
  const start = nodeData.ganttStartDate
    ? new Date(nodeData.ganttStartDate).getTime()
    : Date.now();
  const end = nodeData.ganttEndDate
    ? new Date(nodeData.ganttEndDate).getTime()
    : start + 86400000 * 14;
  const now = Date.now();
  const todayPercent = Math.max(
    0,
    Math.min(100, ((now - start) / (end - start)) * 100),
  );

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  const fmt = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—";

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="w-[280px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3"
      >
        <p className="text-body-sm font-medium text-on-surface">
          {nodeData.task.title}
        </p>
        <div className="relative mt-2 h-6 overflow-hidden rounded-full bg-white/5 px-2">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: accent }}
          />
          <div
            className="absolute bottom-0 top-0 w-px bg-white/30"
            style={{ left: `${todayPercent}%` }}
          />
          <span className="relative z-10 flex h-full items-center justify-center text-[9px] text-on-surface">
            {progress}%
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[9px] text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fmt(nodeData.ganttStartDate)}
          </span>
          <span className="flex items-center gap-1">
            {fmt(nodeData.ganttEndDate)}
            <Calendar className="h-3 w-3" />
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
