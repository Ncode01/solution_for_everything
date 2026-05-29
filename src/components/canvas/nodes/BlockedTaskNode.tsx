"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Lock } from "lucide-react";
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

type BlockedData = TaskCardNodeData & {
  blockedReason?: string | null;
  blockedByTaskId?: string | null;
};

export const BlockedTaskNode = React.memo(function BlockedTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as BlockedData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

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
        className="w-[220px] rounded-lg border border-[#DD6974]/25 bg-[#DD6974]/[0.06] p-3"
      >
        <div className="flex items-start gap-2">
          <span className="flex items-center gap-1 rounded bg-[#DD6974]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#DD6974]">
            <Lock className="h-3 w-3" />
            Blocked
          </span>
          <p className="flex-1 text-body-sm font-medium text-on-surface">
            {nodeData.task.title}
          </p>
        </div>
        {nodeData.blockedReason && (
          <p className="mt-2 text-[11px] italic leading-snug text-[#DD6974]/90">
            {nodeData.blockedReason}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-[10px] text-on-surface-variant">
          {nodeData.blockedByTaskId && (
            <span className="font-mono-label">↳ blocker linked</span>
          )}
          <div className="flex -space-x-1">
            {nodeData.assignees.slice(0, 2).map((u) => (
              <span
                key={u.id}
                className="rounded bg-surface-container px-1 font-mono-label text-[9px]"
              >
                {u.initials}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
