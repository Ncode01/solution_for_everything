"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Activity, BarChart3, Users } from "lucide-react";

export interface StatsNodeData {
  label: string;
  value: string | number;
  description?: string;
  kind?: "tasks" | "members" | "progress";
  [key: string]: unknown;
}
type StatsFlowNode = Node<StatsNodeData, "statsNode">;

const ICON = {
  tasks: BarChart3,
  members: Users,
  progress: Activity,
} as const;

export default function StatsNode({ data, selected }: NodeProps<StatsFlowNode>) {
  const Icon = ICON[data.kind ?? "progress"];

  return (
    <div
      className={`w-[200px] rounded-xl border bg-surface-container p-3 shadow-sm transition-shadow hover:shadow-md ${
        selected ? "border-primary/70 ring-2 ring-primary/30" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Icon size={14} />
        <span className="text-[11px]">{data.label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-on-surface">{data.value}</p>
      {data.description ? (
        <p className="mt-1 text-[10px] text-on-surface-variant">{data.description}</p>
      ) : null}
    </div>
  );
}
