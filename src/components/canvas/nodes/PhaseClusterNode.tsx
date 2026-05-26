"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { PhaseClusterNodeData } from "@/types";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

export const PhaseClusterNode = React.memo(function PhaseClusterNode({
  data,
}: NodeProps) {
  const nodeData = data as PhaseClusterNodeData;
  const accentColor = COLOR_MAP[nodeData.projectColor] ?? "#5591C7";

  return (
    <div className="w-[160px] rounded-lg border border-white/[0.06] bg-surface-container-low">
      <div
        className="h-0.5 rounded-t-lg"
        style={{ backgroundColor: accentColor, opacity: 0.8 }}
      />
      <div className="p-2.5">
        <p className="text-body-sm truncate font-medium text-on-surface">
          {nodeData.phase.name}
        </p>
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${nodeData.phase.completionPercent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <p className="font-mono-label mt-1.5 text-[9px] text-on-surface-variant">
          {nodeData.phase.doneCount}/{nodeData.phase.taskCount} done
        </p>
      </div>
    </div>
  );
});
