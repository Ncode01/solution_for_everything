"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Flag, Lock } from "lucide-react";
import { colors, typography } from "@/design-system";
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
  const isPastDue = nodeData.daysUntil < 0;
  const subClass = isPastDue
    ? "text-[#DD6974]"
    : nodeData.daysUntil <= 7
      ? "text-[#DD6974]"
      : nodeData.daysUntil <= 30
        ? "text-[#E8AF34]"
        : colors.text.tertiary;

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

      <div className="relative flex h-12 w-12 items-center justify-center">
        <div
          className={`absolute inset-2 rounded-sm border-2 ${colors.bg.elevated}`}
          style={{
            borderColor: isPastDue ? "#DD6974" : `${accent}80`,
            transform: "rotate(45deg)",
            boxShadow: isPastDue ? undefined : `0 0 8px ${glow}55`,
          }}
        />
        <Flag
          size={14}
          className="relative z-10"
          style={{ color: isPastDue ? "#DD6974" : accent }}
        />
        {nodeData.isHardDeadline && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-highest">
            <Lock size={10} className="text-on-surface-variant" aria-hidden />
          </span>
        )}
      </div>

      <p
        className={`mt-2 max-w-[120px] truncate text-center ${typography.scale.xs.class} ${isPastDue ? "text-[#DD6974]" : colors.text.tertiary}`}
      >
        {title}
      </p>
      <p className={`${typography.scale.xs.class} ${subClass}`}>{sub}</p>
    </div>
  );
});
