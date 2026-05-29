"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";

export interface StickyNoteNodeData {
  content: string;
  authorName: string;
  timestamp: string;
  variant?: "yellow" | "teal" | "pink" | "blue";
  [key: string]: unknown;
}

const BG: Record<string, string> = {
  yellow: "#2C2810",
  teal: "#0D2420",
  pink: "#2A0F18",
  blue: "#0D1A2C",
};

const FOLD: Record<string, string> = {
  yellow: "#1A1600",
  teal: "#061210",
  pink: "#150810",
  blue: "#060D18",
};

export const StickyNoteNode = React.memo(function StickyNoteNode({
  data,
}: NodeProps) {
  const d = data as StickyNoteNodeData;
  const variant = d.variant ?? "yellow";
  const bg = BG[variant];
  const fold = FOLD[variant];

  return (
    <div
      className="relative w-[180px] rounded-lg p-3 shadow-md"
      style={{ backgroundColor: bg }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-0 w-0"
        style={{
          borderWidth: 16,
          borderStyle: "solid",
          borderColor: `transparent ${fold} ${fold} transparent`,
        }}
      />
      <p className="text-[11px] italic leading-relaxed text-on-surface/90">
        {d.content}
      </p>
      <p className="mt-3 text-[9px] text-on-surface-variant">
        {d.authorName} · {d.timestamp}
      </p>
    </div>
  );
});
