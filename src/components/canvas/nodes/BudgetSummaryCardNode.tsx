"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { accentHex } from "@/lib/canvas/node-colors";

export interface BudgetSummaryCardNodeData {
  allocated: number;
  spent: number;
  remaining: number;
  weeklyBurnRate: number;
  projectColor: string;
  [key: string]: unknown;
}

export const BudgetSummaryCardNode = React.memo(
  function BudgetSummaryCardNode({ data }: NodeProps) {
    const d = data as BudgetSummaryCardNodeData;
    const accent = accentHex(d.projectColor);
    const spark = [0.6, 0.75, 0.7, 0.85, 0.9, 0.8, 1].map(
      (m, i) => 8 + i * 2 + m * 4,
    );

    return (
      <div className="w-[280px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["Allocated", d.allocated],
              ["Spent", d.spent],
              ["Remaining", d.remaining],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">
                {label}
              </p>
              <p className="text-[20px] font-bold tabular-nums text-on-surface">
                ${value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-[10px] text-on-surface-variant">
            Burn rate: ${d.weeklyBurnRate.toLocaleString()}/week
          </p>
          <svg viewBox="0 0 48 16" className="h-4 w-12">
            <polyline
              fill="none"
              stroke={accent}
              strokeWidth={1.5}
              points={spark
                .map((h, i) => `${i * 8},${16 - h}`)
                .join(" ")}
            />
          </svg>
        </div>
      </div>
    );
  },
);
