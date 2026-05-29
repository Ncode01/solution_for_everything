"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { User } from "@/types";
import { accentHex } from "@/lib/canvas/node-colors";

export interface WorkloadCardNodeData {
  user: User;
  projectColor: string;
  weeklyHours: number[];
  [key: string]: unknown;
}

const LOAD_CHIP: Record<string, string> = {
  available: "text-[#6DAA45] bg-[#6DAA45]/10",
  at_capacity: "text-[#E8AF34] bg-[#E8AF34]/10",
  overloaded: "text-[#DD6974] bg-[#DD6974]/10",
};

export const WorkloadCardNode = React.memo(function WorkloadCardNode({
  data,
}: NodeProps) {
  const d = data as WorkloadCardNodeData;
  const accent = accentHex(d.projectColor);
  const hours = d.weeklyHours.length === 5 ? d.weeklyHours : [0, 0, 0, 0, 0];
  const totalHours = hours.reduce((a, b) => a + b, 0);
  const loadPercent = Math.min(100, Math.round((totalHours / 40) * 100));
  const chip = LOAD_CHIP[d.user.loadLevel] ?? LOAD_CHIP.available;

  return (
    <div className="w-[220px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-body-sm font-bold text-on-surface"
          style={{ backgroundColor: `${accent}25` }}
        >
          {d.user.initials.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-medium text-on-surface">
            {d.user.name}
          </p>
          <span className={`rounded px-1.5 py-0.5 text-[9px] capitalize ${chip}`}>
            {d.user.loadLevel.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="relative mt-3 flex h-12 items-end justify-between gap-1">
        <div className="pointer-events-none absolute left-0 right-0 top-[18px] border-t border-dashed border-white/20" />
        {hours.map((h, i) => (
          <div
            key={i}
            className="w-6 rounded-t-sm"
            style={{
              height: `${Math.min(100, (h / 10) * 100)}%`,
              backgroundColor: accent,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-on-surface-variant">
        {d.user.taskCount} tasks · {loadPercent}% capacity
      </p>
    </div>
  );
});
