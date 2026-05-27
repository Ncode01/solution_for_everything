"use client";

import { CheckCircle2 } from "lucide-react";
import type { CriticalPathItem } from "@/lib/dashboard/dashboardUtils";

interface CriticalPathPanelProps {
  items: CriticalPathItem[];
  onTaskClick: (taskId: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-outline",
  in_progress: "bg-primary",
  blocked: "bg-[#E8AF34] animate-pulse",
  in_review: "bg-[#A86FDF]",
  done: "bg-[#6DAA45]",
};

function slackBadgeClass(days: number): string {
  if (days <= 0) {
    return "rounded-full border border-[#E8AF34]/30 bg-[#E8AF34]/20 px-2 py-0.5 text-xs text-[#E8AF34]";
  }
  if (days <= 2) {
    return "rounded-full bg-orange-400/15 px-2 py-0.5 text-xs text-orange-300";
  }
  return "rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant";
}

export function CriticalPathPanel({
  items,
  onTaskClick,
}: CriticalPathPanelProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface-container p-4">
      <header className="flex items-center gap-2">
        <h2 className="text-section-header text-on-surface-variant uppercase">
          Critical Path
        </h2>
        <span className="h-2 w-2 rounded-full bg-[#E8AF34]" />
        <span className="font-mono-label ml-auto rounded-full border border-white/10 px-2 py-0.5 text-mono-label text-on-surface-variant">
          {items.length}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-on-surface-variant">
          <CheckCircle2 size={28} className="text-outline" />
          <p className="text-body-sm">No critical path tasks found</p>
        </div>
      ) : (
        <ul className="hide-scrollbar max-h-[340px] space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.taskId}
              className="flex items-start gap-2 rounded-lg border border-white/5 px-2 py-2 hover:bg-white/[0.03]"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? STATUS_DOT.not_started}`}
              />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onTaskClick(item.taskId)}
                  className="text-body-sm block truncate text-left font-medium text-on-surface hover:text-primary"
                >
                  {item.title}
                </button>
                <p className="text-body-sm truncate text-outline">
                  {item.projectName}
                </p>
                <div className="mt-1 flex gap-1">
                  {item.assigneeInitials.slice(0, 2).map((initial) => (
                    <span
                      key={initial}
                      className="rounded-full border border-white/10 px-1.5 text-[10px] text-on-surface-variant"
                    >
                      {initial}
                    </span>
                  ))}
                </div>
              </div>
              <span className={slackBadgeClass(item.slackDays)}>
                {item.slackDays}d slack
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
