"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

export const PhaseHeaderNode = React.memo(function PhaseHeaderNode({
  data,
}: NodeProps) {
  const { phaseName, projectColor } = data as {
    phaseName: string;
    projectColor: string;
  };
  const accent = COLOR_MAP[projectColor] ?? "#5591C7";

  return (
    <div className="pointer-events-none w-[200px] select-none">
      <div
        className="flex items-center gap-2 rounded-md px-3 py-1.5"
        style={{
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
        }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span
          className="text-section-header font-semibold uppercase tracking-wide"
          style={{ color: accent }}
        >
          {phaseName}
        </span>
      </div>
    </div>
  );
});
