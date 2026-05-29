"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Lock } from "lucide-react";
import type { MilestoneNodeData } from "@/types/project-extensions";

const COLOR_MAP: Record<string, string> = {
  coral: "#E05C5C",
  amber: "#E8AF34",
  violet: "#A86FDF",
  sky: "#5591C7",
  mint: "#6DAA45",
};

function formatDaysLabel(daysUntil: number): string {
  if (daysUntil === 0) return "TODAY";
  if (daysUntil > 0) return `In ${daysUntil}d`;
  return `${Math.abs(daysUntil)}d ago`;
}

function borderGlow(daysUntil: number): string {
  if (daysUntil <= 7) return "#ef4444";
  if (daysUntil <= 30) return "#f59e0b";
  return "#22c55e";
}

export const MilestoneNode = memo(function MilestoneNode({ data }: NodeProps) {
  const nodeData = data as MilestoneNodeData;
  const accent = COLOR_MAP[nodeData.projectColor] ?? "#5591C7";
  const glow = borderGlow(nodeData.daysUntil);
  const title =
    nodeData.title.length > 20
      ? `${nodeData.title.slice(0, 20)}…`
      : nodeData.title;
  const sub = formatDaysLabel(nodeData.daysUntil);
  const subClass =
    nodeData.daysUntil <= 7
      ? "text-[#DD6974]"
      : nodeData.daysUntil <= 30
        ? "text-[#E8AF34]"
        : "text-outline";

  return (
    <div
      className="relative flex w-[120px] flex-col items-center"
      title={`${nodeData.title} — ${nodeData.date}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-white/20 !bg-surface-container-high"
      />

      <div className="relative h-12 w-12">
        <div
          className="absolute inset-0 rounded-sm border-2"
          style={{
            backgroundColor: `${accent}33`,
            borderColor: glow,
            transform: "rotate(45deg)",
            boxShadow: `0 0 8px ${glow}55`,
          }}
        />
        {nodeData.isHardDeadline && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-highest">
            <Lock size={10} className="text-on-surface-variant" aria-hidden />
          </span>
        )}
      </div>

      <p className="mt-2 max-w-[120px] truncate text-center font-mono-label text-mono-label text-on-surface">
        {title}
      </p>
      <p className={`font-mono-label text-[10px] ${subClass}`}>{sub}</p>
    </div>
  );
});
