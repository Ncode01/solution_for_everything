"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ApiChecklistItem } from "@/lib/api/types";
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

type ChecklistData = TaskCardNodeData & {
  checklist?: ApiChecklistItem[] | null;
};

export const ChecklistTaskNode = React.memo(function ChecklistTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as ChecklistData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const accent = accentHex(nodeData.projectColor);
  const items = nodeData.checklist ?? [];
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const visible = items.slice(0, 4);
  const overflow = items.length - visible.length;

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
        className="w-[240px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-body-sm font-medium text-on-surface">
            {nodeData.task.title}
          </p>
          <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono-label text-[10px] text-on-surface-variant">
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: accent }}
          />
        </div>
        <ul className="mt-2 space-y-1">
          {visible.map((item) => (
            <li key={item.id} className="flex items-center gap-1.5 text-[10px]">
              {item.done ? (
                <span className="text-[#6DAA45]">✓</span>
              ) : (
                <span className="text-on-surface-variant">○</span>
              )}
              <span
                className={
                  item.done
                    ? "text-on-surface-variant line-through opacity-45"
                    : "text-on-surface"
                }
              >
                {item.label}
              </span>
            </li>
          ))}
          {overflow > 0 && (
            <li className="text-[9px] text-outline">+{overflow} more</li>
          )}
        </ul>
        <div className="mt-2 flex items-center justify-between text-[10px] text-on-surface-variant">
          <span className="font-mono-label">{nodeData.task.effortEstimate}h</span>
          <span>{nodeData.assignees[0]?.initials ?? ""}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
