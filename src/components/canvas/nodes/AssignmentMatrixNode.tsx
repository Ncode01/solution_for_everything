"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { ApiTask } from "@/lib/api/types";
import type { Phase, User } from "@/types";

export interface AssignmentMatrixNodeData {
  users: User[];
  phases: Phase[];
  tasks: ApiTask[];
  projectColor: string;
  [key: string]: unknown;
}

function cellOpacity(count: number): string {
  if (count === 0) return "transparent";
  if (count === 1) return "rgba(85,145,199,0.3)";
  if (count === 2) return "rgba(85,145,199,0.5)";
  return "rgba(85,145,199,0.8)";
}

export const AssignmentMatrixNode = React.memo(function AssignmentMatrixNode({
  data,
}: NodeProps) {
  const d = data as AssignmentMatrixNodeData;
  const phases = d.phases.slice(0, 4);
  const users = d.users.slice(0, 5);

  return (
    <div className="w-[260px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <p className="text-section-header text-on-surface-variant">Assignments</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="w-8" />
              {phases.map((ph) => (
                <th
                  key={ph.id}
                  className="max-w-[40px] truncate pb-1 font-normal text-outline"
                  style={{ transform: "rotate(-30deg)", transformOrigin: "left" }}
                >
                  {ph.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-0.5 font-mono-label text-outline">
                  {u.initials}
                </td>
                {phases.map((ph) => {
                  const count = d.tasks.filter(
                    (t) =>
                      t.phaseId === ph.id && t.assigneeIds.includes(u.id),
                  ).length;
                  return (
                    <td key={ph.id} className="p-0.5">
                      <div
                        className="mx-auto h-5 w-5 rounded-sm"
                        style={{ backgroundColor: cellOpacity(count) }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[8px] text-outline">
        ● 1 task · ●● 2 · ●●● 3+
      </p>
    </div>
  );
});
