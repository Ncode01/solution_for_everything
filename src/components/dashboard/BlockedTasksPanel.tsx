"use client";

import { ShieldCheck } from "lucide-react";
import type { BlockedTaskItem } from "@/lib/dashboard/dashboardUtils";

interface BlockedTasksPanelProps {
  items: BlockedTaskItem[];
  onTaskClick: (taskId: string) => void;
}

export function BlockedTasksPanel({
  items,
  onTaskClick,
}: BlockedTasksPanelProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface-container p-4">
      <header className="flex items-center gap-2">
        <h2 className="text-section-header text-on-surface-variant uppercase">
          Blocked Tasks
        </h2>
        <span className="h-2 w-2 rounded-full bg-error" />
        <span className="font-mono-label ml-auto rounded-full border border-white/10 px-2 py-0.5 text-mono-label text-on-surface-variant">
          {items.length}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-on-surface-variant">
          <ShieldCheck size={28} className="text-outline" />
          <p className="text-body-sm">No blocked tasks</p>
        </div>
      ) : (
        <ul className="hide-scrollbar max-h-[340px] space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.taskId}
              className="rounded-lg border border-white/5 px-2 py-2 hover:bg-white/[0.03]"
            >
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
              {item.blockers.length > 0 ? (
                <p className="text-body-sm mt-1 text-on-surface-variant">
                  Blocked by: {item.blockers.join(", ")}
                </p>
              ) : null}
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
