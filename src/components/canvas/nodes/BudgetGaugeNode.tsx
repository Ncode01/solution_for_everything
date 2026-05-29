"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { accentHex } from "@/lib/canvas/node-colors";

export interface BudgetGaugeNodeData {
  allocated: number;
  spent: number;
  projectColor: string;
  [key: string]: unknown;
}

export const BudgetGaugeNode = React.memo(function BudgetGaugeNode({
  data,
}: NodeProps) {
  const { allocated, spent, projectColor } = data as BudgetGaugeNodeData;
  const accent = accentHex(projectColor);
  const burnPercent =
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
  const remaining = allocated - spent;
  const remainingPct = allocated > 0 ? (remaining / allocated) * 100 : 0;
  const remainingClass =
    remainingPct > 20
      ? "text-[#6DAA45]"
      : remaining >= 0
        ? "text-[#E8AF34]"
        : "text-[#DD6974]";

  const r = 50;
  const cx = 80;
  const cy = 55;
  const startAngle = Math.PI;
  const endAngle = startAngle + (burnPercent / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = burnPercent > 50 ? 1 : 0;

  return (
    <div className="w-[200px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <p className="text-section-header text-on-surface-variant">Budget</p>
      <svg viewBox="0 0 160 90" className="mx-auto mt-1 h-[90px] w-full">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {burnPercent > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={accent}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
      </svg>
      <p
        className="text-center text-[22px] font-bold tabular-nums"
        style={{ color: accent }}
      >
        {burnPercent}%
      </p>
      <p className="mt-1 text-center font-mono-label text-[10px] text-on-surface-variant">
        ${spent.toLocaleString()} / ${allocated.toLocaleString()}
      </p>
      <p className={`mt-1 text-center text-[10px] ${remainingClass}`}>
        Remaining: ${remaining.toLocaleString()}
      </p>
    </div>
  );
});
