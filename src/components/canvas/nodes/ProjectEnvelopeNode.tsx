"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeResizer } from "@xyflow/react";
import type { ProjectEnvelopeNodeData } from "@/types";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  planning: "#4f4f4d",
  active: "#5591C7",
  on_hold: "#E8AF34",
  completed: "#6DAA45",
};

export const ProjectEnvelopeNode = React.memo(function ProjectEnvelopeNode({
  data,
  selected,
}: NodeProps) {
  const d = data as ProjectEnvelopeNodeData;
  const accent = COLOR_MAP[d.projectColor] ?? "#5591C7";
  const statusColor = STATUS_COLOR[d.status] ?? "#4f4f4d";

  const r = 9;
  const circ = 2 * Math.PI * r;
  const dash = (d.completionPercent / 100) * circ;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        width: d.envelopeWidth,
        height: d.envelopeHeight,
        background: `${accent}05`,
        border: `1px solid ${accent}20`,
      }}
    >
      <div
        className="flex h-8 cursor-move items-center gap-2 px-3"
        style={{
          background: `${accent}18`,
          borderBottom: `1px solid ${accent}25`,
        }}
      >
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />

        <span
          className="flex-1 truncate text-[12px] font-semibold tracking-wide"
          style={{ color: accent }}
        >
          {d.projectName}
        </span>

        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {STATUS_LABEL[d.status] ?? d.status}
        </span>

        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="-rotate-90 shrink-0"
        >
          <circle
            cx="12"
            cy="12"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="w-6 text-right text-[9px] tabular-nums"
          style={{ color: accent }}
        >
          {Math.round(d.completionPercent)}%
        </span>
      </div>

      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={selected}
        lineStyle={{ stroke: `${accent}40`, strokeWidth: 1 }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: accent,
          border: "none",
        }}
      />
    </div>
  );
});
