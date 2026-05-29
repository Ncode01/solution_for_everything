"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";
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

const SEVERITY: Record<string, string> = {
  critical: "#DD6974",
  high: "#E8AF34",
  medium: "#9C7EC7",
  low: "#5591C7",
};

type RiskData = TaskCardNodeData & {
  riskLevel?: string | null;
  riskDescription?: string | null;
};

export const RiskFlagNode = React.memo(function RiskFlagNode({
  data,
  id,
}: NodeProps) {
  const nodeData = data as RiskData;
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const level = nodeData.riskLevel ?? "medium";
  const color = SEVERITY[level] ?? SEVERITY.medium;

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
        className="relative w-[200px] overflow-hidden rounded-lg border border-white/[0.08] bg-surface-container-low p-3"
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-[3px]"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-start gap-2 pl-1">
          <AlertTriangle className="h-5 w-5 shrink-0" style={{ color }} />
          <div className="min-w-0 flex-1">
            <span
              className="rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest"
              style={{ background: `${color}20`, color }}
            >
              {level}
            </span>
            <p className="mt-1 text-body-sm font-bold text-on-surface">
              {nodeData.task.title}
            </p>
            {nodeData.riskDescription && (
              <p className="mt-1 line-clamp-1 text-[10px] italic text-on-surface-variant">
                {nodeData.riskDescription}
              </p>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </>
  );
});
