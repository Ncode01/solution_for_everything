"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { User } from "@/types";
import { accentHex } from "@/lib/canvas/node-colors";

const RING: Record<string, string> = {
  available: "#6DAA45",
  at_capacity: "#E8AF34",
  overloaded: "#DD6974",
};

export interface TeamClusterNodeData {
  users: User[];
  totalTaskCount: number;
  projectColor: string;
  [key: string]: unknown;
}

export const TeamClusterNode = React.memo(function TeamClusterNode({
  data,
}: NodeProps) {
  const d = data as TeamClusterNodeData;
  const accent = accentHex(d.projectColor);
  const visible = d.users.slice(0, 5);
  const more = d.users.length - visible.length;

  return (
    <div className="w-[200px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <p className="text-section-header text-on-surface-variant">Team</p>
      <div className="mt-2 flex items-center pl-2">
        {visible.map((u, i) => (
          <div
            key={u.id}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold text-on-surface"
            style={{
              marginLeft: i === 0 ? 0 : -12,
              borderColor: RING[u.loadLevel] ?? accent,
              backgroundColor: "var(--color-surface-container)",
            }}
          >
            {u.initials.slice(0, 2)}
          </div>
        ))}
        {more > 0 && (
          <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-on-surface-variant">
            +{more}
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] text-on-surface-variant">
        {d.users.length} members · {d.totalTaskCount} total tasks
      </p>
    </div>
  );
});
