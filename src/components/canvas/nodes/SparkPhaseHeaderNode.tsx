"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { SparkPhaseHeaderNodeData } from "@/types";

export const SparkPhaseHeaderNode = React.memo(function SparkPhaseHeaderNode({
  data,
}: NodeProps) {
  const {
    phaseName,
    taskCount,
    doneCount,
    isLocked,
    showCompleteGlow,
  } = data as SparkPhaseHeaderNodeData;

  const allDone = taskCount > 0 && doneCount === taskCount;
  const progress = taskCount > 0 ? doneCount / taskCount : 0;

  return (
    <div
      className={[
        "relative h-14 w-[200px] select-none overflow-hidden rounded-xl border border-[rgba(139,92,246,0.25)]",
        showCompleteGlow ? "spark-phase-complete-glow" : "",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
      }}
    >
      {isLocked ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[rgba(12,11,20,0.5)]"
          aria-hidden
        >
          <Lock size={20} className="text-white/40" />
        </div>
      ) : null}
      <div className="flex h-full flex-col justify-between px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[rgba(139,92,246,0.9)]">
            {phaseName.replace(/^SparkIT\s+/i, "")}
          </span>
          {allDone ? (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6DAA45]">
              ✓ COMPLETE
            </span>
          ) : (
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">
              {taskCount} tasks
            </span>
          )}
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full rounded-full bg-[rgba(139,92,246,0.6)] transition-all duration-500 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
