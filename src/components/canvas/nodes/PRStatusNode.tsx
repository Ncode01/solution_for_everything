"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { ExternalLink } from "lucide-react";

export interface PRStatusNodeData {
  prTitle: string;
  prUrl: string | null;
  prStatus: "open" | "merged" | "closed";
  taskTitle: string;
  projectColor: string;
  [key: string]: unknown;
}

const STATUS_STYLE: Record<string, string> = {
  open: "text-[#6DAA45] bg-[#6DAA45]/10",
  merged: "text-[#9C7EC7] bg-[#9C7EC7]/10",
  closed: "text-[#DD6974] bg-[#DD6974]/10",
};

export const PRStatusNode = React.memo(function PRStatusNode({
  data,
}: NodeProps) {
  const d = data as PRStatusNodeData;
  const prNum = d.prUrl?.match(/\/pull\/(\d+)/)?.[1] ?? "?";

  return (
    <div className="w-[220px] rounded-lg border border-white/[0.08] bg-surface-container-low p-3">
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 opacity-60">
          <path
            fill="currentColor"
            className="text-on-surface"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-body-sm text-on-surface">{d.prTitle}</p>
          <div className="mt-1 flex items-center justify-between">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] capitalize ${STATUS_STYLE[d.prStatus]}`}
            >
              {d.prStatus}
            </span>
            <span className="font-mono-label text-[10px] text-outline">
              PR #{prNum}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[9px] text-on-surface-variant">
        <ExternalLink className="h-3 w-3" />
        Open in GitHub
      </p>
    </div>
  );
});
