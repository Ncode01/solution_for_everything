"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";

export interface StatusMatrixNodeData {
  statusCounts: {
    done: number;
    in_progress: number;
    review: number;
    todo: number;
    blocked: number;
  };
  projectColor: string;
  [key: string]: unknown;
}

const SEGMENTS = [
  { key: "done" as const, color: "#6DAA45", label: "Done" },
  { key: "in_progress" as const, color: "#5591C7", label: "In Progress" },
  { key: "review" as const, color: "#E8AF34", label: "Review" },
  { key: "todo" as const, color: "#4f4f4d", label: "Todo" },
  { key: "blocked" as const, color: "#DD6974", label: "Blocked" },
];

export const StatusMatrixNode = React.memo(function StatusMatrixNode({
  data,
}: NodeProps) {
  const d = data as StatusMatrixNodeData;
  const total = SEGMENTS.reduce((s, seg) => s + d.statusCounts[seg.key], 0);

  return (
    <div className="w-[260px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <p className="text-section-header text-on-surface-variant">Status</p>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full">
        {SEGMENTS.map((seg) => {
          const n = d.statusCounts[seg.key];
          if (n === 0) return null;
          const w = total > 0 ? (n / total) * 100 : 0;
          return (
            <div
              key={seg.key}
              style={{ width: `${w}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${n}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-on-surface-variant">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label} ({d.statusCounts[seg.key]})
          </span>
        ))}
      </div>
    </div>
  );
});
