"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { accentHex } from "@/lib/canvas/node-colors";

export interface PhaseProgressRingNodeData {
  phaseName: string;
  doneCount: number;
  taskCount: number;
  completionPercent: number;
  projectColor: string;
  [key: string]: unknown;
}

export const PhaseProgressRingNode = React.memo(
  function PhaseProgressRingNode({ data }: NodeProps) {
    const d = data as PhaseProgressRingNodeData;
    const accent = accentHex(d.projectColor);
    const pct = Math.round(d.completionPercent);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div className="w-[160px] rounded-lg border border-white/[0.08] bg-surface-container-low p-2 text-center">
        <svg viewBox="0 0 160 120" className="mx-auto h-[100px] w-full">
          <circle
            cx={80}
            cy={60}
            r={45}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
          />
          <circle
            cx={80}
            cy={60}
            r={45}
            fill="none"
            stroke={accent}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 80 60)"
          />
          <text
            x={80}
            y={64}
            textAnchor="middle"
            className="fill-on-surface text-[13px] font-bold"
          >
            {d.doneCount}/{d.taskCount}
          </text>
        </svg>
        <p className="truncate text-[10px] text-on-surface-variant">
          {d.phaseName}
        </p>
      </div>
    );
  },
);
