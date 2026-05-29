"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { RefreshCw } from "lucide-react";
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

type RecurringData = TaskCardNodeData & {
  recurrence?: string | null;
  recurrenceNext?: string | null;
  recurrenceLast?: string | null;
};

export const RecurringTaskNode = React.memo(function RecurringTaskNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as RecurringData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const accent = accentHex(nodeData.projectColor);
  const cadence = nodeData.recurrence ?? "weekly";

  const handleClick = useCallback(() => {
    selectNode(id, "task");
    openTaskView();
  }, [id, selectNode, openTaskView]);

  const formatDate = (iso?: string | null) =>
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
        className="w-[220px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3"
      >
        <div className="flex items-center gap-2">
          <RefreshCw
            className="h-4 w-4 shrink-0 animate-pulse"
            style={{ color: accent }}
          />
          <p className="flex-1 truncate text-body-sm font-medium text-on-surface">
            {nodeData.task.title}
          </p>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[#6DAA45]/10 px-2 py-0.5 text-[9px] capitalize text-[#6DAA45]">
          ↻ {cadence}
        </span>
        <div className="mt-2 flex justify-between font-mono-label text-[9px] text-on-surface-variant">
          <span>Next: {formatDate(nodeData.recurrenceNext)}</span>
          <span>Last: {formatDate(nodeData.recurrenceLast)}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
