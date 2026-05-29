"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TaskCardNodeData, User } from "@/types";
import { handleKeyboardActivate } from "@/lib/a11y/keyboardActivate";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";

const HANDLE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  width: 8,
  height: 8,
};

type ReviewData = TaskCardNodeData & {
  approverUser?: User | null;
};

export const ReviewTaskNode = React.memo(function ReviewTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as ReviewData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const reviewer = nodeData.approverUser;

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
        className="flex w-[240px] overflow-hidden rounded-lg border border-white/[0.08] bg-surface-container-low"
      >
        <div className="w-[60%] p-3">
          <p className="text-body-sm font-medium text-on-surface">
            {nodeData.task.title}
          </p>
          <p className="mt-1 text-[10px] capitalize text-on-surface-variant">
            {nodeData.task.status.replace("_", " ")}
          </p>
          <p className="mt-2 font-mono-label text-[10px] text-outline">
            {nodeData.task.effortEstimate}h
          </p>
        </div>
        <div className="flex w-[40%] flex-col items-center justify-center border-l border-white/[0.08] bg-surface-container-high/50 p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-body-sm font-bold text-on-surface">
            {reviewer?.initials.slice(0, 2) ?? "?"}
          </div>
          <p className="mt-1 truncate text-[10px] text-on-surface-variant">
            {reviewer?.name ?? "Reviewer"}
          </p>
          <p className="mt-1 text-[9px] text-[#E8AF34]">Awaiting review</p>
          <div className="mt-2 flex gap-1">
            <span className="rounded border border-[#6DAA45]/20 bg-[#6DAA45]/10 px-1.5 py-0.5 text-[8px] text-[#6DAA45]">
              Approve
            </span>
            <span className="rounded border border-[#DD6974]/20 bg-[#DD6974]/10 px-1.5 py-0.5 text-[8px] text-[#DD6974]">
              Reject
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
