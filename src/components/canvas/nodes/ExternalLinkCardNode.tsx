"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import type { ApiExternalLink } from "@/lib/api/types";

export interface ExternalLinkCardNodeData {
  link: ApiExternalLink;
  taskTitle: string;
  projectColor: string;
  [key: string]: unknown;
}

const ICON: Record<string, string> = {
  figma: "🎨",
  github: "⚙",
  notion: "📄",
  loom: "🎬",
  doc: "📝",
  other: "🔗",
};

export const ExternalLinkCardNode = React.memo(function ExternalLinkCardNode({
  data,
}: NodeProps) {
  const d = data as ExternalLinkCardNodeData;
  let domain = d.link.url;
  try {
    domain = new URL(d.link.url).hostname;
  } catch {
    /* keep raw */
  }

  return (
    <div className="w-[220px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3 transition-colors hover:border-white/20">
      <div className="flex items-start gap-2">
        <span className="text-lg">{ICON[d.link.type] ?? ICON.other}</span>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-medium text-on-surface">
            {d.link.label}
          </p>
          <p className="truncate text-[10px] opacity-50 text-on-surface-variant">
            {domain}
          </p>
          <p className="mt-1 truncate text-[9px] text-outline">↳ {d.taskTitle}</p>
        </div>
      </div>
    </div>
  );
});
