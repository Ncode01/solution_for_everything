"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TaskCardNodeData } from "@/types";
import { accentHex, STATUS_COLORS } from "@/lib/canvas/node-colors";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

export const EpicTaskNode = React.memo(function EpicTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as TaskCardNodeData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const accent = accentHex(nodeData.projectColor);
  const statusColor = STATUS_COLORS[nodeData.task.status] ?? "#5591C7";

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="relative w-[240px] overflow-hidden rounded-lg border border-white/[0.08] bg-surface-container-low"
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-[3px]"
          style={{ backgroundColor: accent }}
        />
        <div className="absolute right-2 top-2">
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{ background: `${accent}20`, color: accent }}
          >
            EPIC
          </span>
        </div>
        <div className="px-4 pb-3 pt-3">
          <p className="pr-8 text-[13px] font-bold leading-snug text-on-surface">
            {nodeData.task.title}
          </p>
          {nodeData.task.description && (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">
              {nodeData.task.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-2">
              {nodeData.assignees.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container text-[9px] font-bold text-on-surface"
                >
                  {u.initials.slice(0, 2)}
                </div>
              ))}
            </div>
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {nodeData.task.effortEstimate}h
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px]"
              style={{
                background: `${statusColor}20`,
                color: statusColor,
              }}
            >
              {nodeData.task.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
