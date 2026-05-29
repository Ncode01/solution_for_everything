"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { accentHex } from "@/lib/canvas/node-colors";

export interface HealthScoreCardNodeData {
  score: number;
  grade: string;
  dimensions: {
    scope: number;
    time: number;
    cost: number;
    quality: number;
  };
  projectColor: string;
  [key: string]: unknown;
}

function barColor(pct: number): string {
  if (pct >= 75) return "#6DAA45";
  if (pct >= 50) return "#E8AF34";
  return "#DD6974";
}

export const HealthScoreCardNode = React.memo(function HealthScoreCardNode({
  data,
}: NodeProps) {
  const d = data as HealthScoreCardNodeData;
  const accent = accentHex(d.projectColor);
  const dims = [
    ["Scope", d.dimensions.scope],
    ["Time", d.dimensions.time],
    ["Cost", d.dimensions.cost],
    ["Quality", d.dimensions.quality],
  ] as const;

  return (
    <div className="w-[200px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <div className="flex items-baseline gap-2">
        <span
          className="text-[40px] font-black leading-none tabular-nums"
          style={{ color: accent }}
        >
          {d.score}
        </span>
        <span className="rounded bg-white/10 px-2 py-0.5 text-body-sm font-bold uppercase text-on-surface">
          {d.grade === "green"
            ? "A"
            : d.grade === "amber"
              ? "B"
              : d.grade === "red"
                ? "F"
                : "C"}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {dims.map(([label, pct]) => (
          <div key={label}>
            <div className="mb-0.5 flex justify-between text-[9px]">
              <span className="text-on-surface-variant">{label}</span>
              <span className="tabular-nums text-outline">{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: barColor(pct) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
