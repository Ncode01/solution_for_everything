"use client";

import type { Node, NodeProps } from "@xyflow/react";
import type { User } from "@/types";

export interface OrgNodeData {
  name?: string;
  users: User[];
  totalTaskCount: number;
  [key: string]: unknown;
}

type OrgFlowNode = Node<OrgNodeData, "teamCluster">;

export default function OrgNode({ data, selected }: NodeProps<OrgFlowNode>) {
  return (
    <div
      className={`w-[220px] rounded-xl border bg-surface-container-low p-3 shadow-sm transition-shadow hover:shadow-md ${
        selected ? "border-primary/70 ring-2 ring-primary/30" : "border-white/10"
      }`}
    >
      <p className="text-body-sm font-semibold text-on-surface">
        {data.name ?? "Team"}
      </p>
      <p className="mt-1 text-[10px] text-on-surface-variant">
        {data.users.length} members · {data.totalTaskCount} tasks
      </p>
    </div>
  );
}
