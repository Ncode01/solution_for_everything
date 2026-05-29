"use client";

import React, { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { ArrowUpRight } from "lucide-react";
import { focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import { accentHex } from "@/lib/canvas/node-colors";

export interface WarpGateNodeData {
  warpTargetNodeId: string;
  label: string;
  projectColor: string;
  [key: string]: unknown;
}

export const WarpGateNode = React.memo(function WarpGateNode({ data }: NodeProps) {
  const d = data as WarpGateNodeData;
  const accent = accentHex(d.projectColor);

  const handleClick = useCallback(() => {
    void focusCanvasNode(d.warpTargetNodeId, { zoom: 0.85 });
  }, [d.warpTargetNodeId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-[100px] flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="relative flex h-[100px] w-[100px] items-center justify-center">
        <div
          className="absolute inset-0 animate-spin rounded-full border border-dashed opacity-40"
          style={{
            borderColor: accent,
            animationDuration: "8s",
          }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 opacity-70"
          style={{ borderColor: accent }}
        />
        <div
          className="absolute inset-5 rounded-full opacity-30"
          style={{ backgroundColor: accent }}
        />
        <ArrowUpRight className="relative z-10 h-5 w-5" style={{ color: accent }} />
      </div>
      <span className="max-w-full truncate text-[9px] text-on-surface-variant">
        {d.label}
      </span>
    </button>
  );
});
