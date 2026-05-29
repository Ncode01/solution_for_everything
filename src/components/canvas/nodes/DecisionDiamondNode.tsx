"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
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

export const DecisionDiamondNode = React.memo(function DecisionDiamondNode({
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

  return (
    <>
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivate(e, handleClick)}
        className="flex h-[120px] w-[140px] flex-col items-center justify-center"
      >
        <div className="flex h-[100px] w-[100px] rotate-45 items-center justify-center rounded-sm border border-white/20 bg-white/[0.03] shadow-inner">
          <div className="-rotate-45 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface">
              Decision
            </p>
            <p className="mt-1 max-w-[72px] truncate text-[8px] text-on-surface-variant">
              {nodeData.task.title}
            </p>
          </div>
        </div>
        <div className="mt-1 flex w-full justify-between px-1 text-[8px] text-outline">
          <span>YES ↓</span>
          <span>NO →</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
