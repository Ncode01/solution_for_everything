"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { PhaseClusterNodeData } from "@/types";
import { colors, typography } from "@/design-system";

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
    <div
      className="w-[160px] rounded-lg border border-dashed p-2.5"
      style={{
        borderColor: `${accentColor}33`,
        backgroundColor: `${accentColor}08`,
      }}
    >
      <p className={`truncate ${typography.scale.xs.class} ${colors.text.tertiary}`}>
        {nodeData.phase.name}
      </p>
      <div className="mt-2">
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${nodeData.phase.completionPercent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <p className={`mt-1.5 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
          {nodeData.phase.doneCount}/{nodeData.phase.taskCount} done
        </p>
      </div>
    </div>
  );
});
