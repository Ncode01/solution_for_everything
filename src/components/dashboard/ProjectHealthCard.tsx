"use client";

import type { ProjectHealthCard as ProjectHealthCardData } from "@/lib/dashboard/dashboardUtils";

interface ProjectHealthCardProps {
  card: ProjectHealthCardData;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  planning: "bg-surface-container-high text-on-surface-variant",
  completed: "bg-emerald-500/15 text-emerald-400",
  on_hold: "bg-surface-container-high text-on-surface-variant",
};

export function ProjectHealthCard({ card }: ProjectHealthCardProps) {
  const statusClass =
    STATUS_BADGE[card.status] ?? STATUS_BADGE.planning;
  const completion =
    card.totalTasks > 0
      ? Math.round((card.doneTasks / card.totalTasks) * 100)
      : card.completionPercent;

  return (
    <article className="flex min-w-[260px] max-w-[380px] flex-1 flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface-container p-5">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: card.projectColor }}
        />
        <h3 className="text-body-md truncate font-medium text-on-surface">
          {card.projectName}
        </h3>
        <span
          className={`text-body-sm ml-auto shrink-0 rounded-full px-2 py-0.5 capitalize ${statusClass}`}
        >
          {card.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-mint"
            style={{ width: `${Math.min(100, completion)}%` }}
          />
        </div>
        <span className="font-mono-label text-mono-label text-on-surface-variant">
          {completion}%
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-body-sm rounded-full border border-white/10 px-2 py-0.5 text-on-surface-variant">
          {card.totalTasks} tasks
        </span>
        {card.blockedCount > 0 ? (
          <span className="text-body-sm rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-error">
            {card.blockedCount} blocked
          </span>
        ) : null}
        {card.overdueCount > 0 ? (
          <span className="text-body-sm rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-error">
            {card.overdueCount} overdue
          </span>
        ) : null}
        {card.criticalPathCount > 0 ? (
          <span className="text-body-sm rounded-full border border-[#E8AF34]/30 bg-[#E8AF34]/10 px-2 py-0.5 text-[#E8AF34]">
            {card.criticalPathCount} critical
          </span>
        ) : null}
      </div>

      <p className="text-body-sm text-outline">
        Team: {card.teamSize} member{card.teamSize === 1 ? "" : "s"}
      </p>
    </article>
  );
}
