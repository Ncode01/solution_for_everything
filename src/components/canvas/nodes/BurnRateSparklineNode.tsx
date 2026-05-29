"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { accentHex } from "@/lib/canvas/node-colors";

export interface BurnRateSparklineNodeData {
  weeklyBurnRate: number;
  trendPercent: number;
  dailyValues: number[];
  projectColor: string;
  [key: string]: unknown;
}

export const BurnRateSparklineNode = React.memo(
  function BurnRateSparklineNode({ data }: NodeProps) {
    const d = data as BurnRateSparklineNodeData;
    const accent = accentHex(d.projectColor);
    const values = d.dailyValues.length > 0 ? d.dailyValues : [1, 2, 3, 4];
    const max = Math.max(...values, 1);
    const w = 180;
    const h = 40;
    const points = values
      .map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * w;
        const y = h - (v / max) * (h - 4);
        return `${x},${y}`;
      })
      .join(" ");
    const trendUp = d.trendPercent >= 0;

    return (
      <div className="w-[200px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
        <div className="flex items-center justify-between">
          <p className="text-section-header text-on-surface-variant">
            Burn rate
          </p>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] ${
              trendUp ? "text-[#DD6974]" : "text-[#6DAA45]"
            } bg-white/5`}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(d.trendPercent)}% vs last week
          </span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-10 w-full">
          <defs>
            <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#burnFill)"
            points={`0,${h} ${points} ${w},${h}`}
          />
          <polyline
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            points={points}
          />
        </svg>
        <div className="mt-1 flex justify-between text-[8px] text-outline">
          <span>14 days ago</span>
          <span>today</span>
        </div>
      </div>
    );
  },
);
