"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { DollarSign } from "lucide-react";
import type { TaskCardNodeData } from "@/types";
import { STATUS_COLORS } from "@/lib/canvas/node-colors";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

type CostData = TaskCardNodeData & {
  costEstimate?: number | null;
};

export const CostTaskNode = React.memo(function CostTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as CostData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const cost = nodeData.costEstimate ?? 0;
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
        className="w-[220px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-body-sm font-medium text-on-surface">
            {nodeData.task.title}
          </p>
          <span className="flex items-center gap-0.5 font-mono-label text-[12px] font-bold text-[#6DAA45]">
            <DollarSign className="h-3 w-3" />
            {cost.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono-label text-[10px] text-on-surface-variant">
            {nodeData.task.effortEstimate}h
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] capitalize"
            style={{
              background: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {nodeData.task.status.replace("_", " ")}
          </span>
          <span className="text-[10px] text-outline">
            {nodeData.assignees[0]?.initials ?? ""}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
