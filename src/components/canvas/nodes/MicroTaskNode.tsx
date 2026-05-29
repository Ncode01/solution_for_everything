"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TaskCardNodeData } from "@/types";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/canvas/node-colors";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

export const MicroTaskNode = React.memo(function MicroTaskNode({
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

  const statusColor =
    STATUS_COLORS[nodeData.task.status] ?? "#4f4f4d";
  const priorityColor =
    PRIORITY_COLORS[nodeData.task.priority] ?? "#4f4f4d";

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="flex h-[44px] w-[160px] items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-3"
      >
        <div
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="flex-1 truncate text-[11px] font-medium text-on-surface">
          {nodeData.task.title}
        </span>
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: priorityColor, opacity: 0.8 }}
        />
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
