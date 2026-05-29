"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TaskCardNodeData, User } from "@/types";
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

type ApprovalData = TaskCardNodeData & {
  approverUser?: User | null;
};

export const ApprovalGateNode = React.memo(function ApprovalGateNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as ApprovalData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const accent = accentHex(nodeData.projectColor);
  const approver = nodeData.approverUser;

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
        className="flex h-[120px] w-[180px] items-center justify-center"
      >
        <div
          className="flex h-[120px] w-[120px] rotate-45 items-center justify-center rounded-sm border-2"
          style={{
            borderColor: accent,
            backgroundColor: `${accent}10`,
          }}
        >
          <div className="-rotate-45 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">
              Approval
            </p>
            <div className="mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-[9px] font-bold">
              {approver?.initials.slice(0, 2) ?? "?"}
            </div>
            <p className="mt-0.5 max-w-[80px] truncate text-[9px] text-on-surface">
              {approver?.name ?? "Pending"}
            </p>
            <span className="mt-1 inline-block rounded bg-[#E8AF34]/15 px-1 text-[8px] text-[#E8AF34]">
              Pending
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
