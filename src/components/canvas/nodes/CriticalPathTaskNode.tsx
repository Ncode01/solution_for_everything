"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { TaskCardNodeData } from "@/types";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

export const CriticalPathTaskNode = React.memo(function CriticalPathTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as TaskCardNodeData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  const dueDate = nodeData.task.dueDate;
  let countdownLabel = "";
  let countdownClass = "text-white/60";
  if (dueDate) {
    const days = Math.ceil(
      (dueDate.getTime() - Date.now()) / 86400000,
    );
    if (days < 0) {
      countdownLabel = `${Math.abs(days)} days OVERDUE`;
      countdownClass = "text-[#DD6974]";
    } else {
      countdownLabel = `${days} days left`;
      if (days <= 3) countdownClass = "text-[#DD6974]";
      else if (days <= 7) countdownClass = "text-[#E8AF34]";
    }
  }

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="w-[220px] overflow-hidden rounded-lg border border-[#E8AF34]/40 bg-surface-container-low shadow-[0_0_0_1px_rgba(232,175,52,0.15),0_4px_12px_rgba(232,175,52,0.08)]"
      >
        <div className="h-0.5 w-full bg-[#E8AF34]" />
        <div className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#E8AF34]" />
            <p className="text-body-sm font-medium text-on-surface">
              {nodeData.task.title}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded bg-[#E8AF34]/15 px-1.5 py-0.5 font-mono-label text-[9px] uppercase text-[#E8AF34]">
              Critical path
            </span>
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {nodeData.task.effortEstimate}h
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {countdownLabel && (
              <span className={`font-mono-label text-[10px] ${countdownClass}`}>
                {countdownLabel}
              </span>
            )}
            <div className="flex -space-x-2">
              {nodeData.assignees.slice(0, 2).map((u) => (
                <div
                  key={u.id}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-surface-container-low bg-surface-container text-[8px] font-bold"
                >
                  {u.initials.slice(0, 2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
