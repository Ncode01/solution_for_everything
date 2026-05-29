"use client";

import React, { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { ProjectClusterNodeData } from "@/types";
import type { ProjectType } from "@/types/project-extensions";
import { colors, typography } from "@/design-system";
import { useCanvasStore } from "@/stores/canvas.store";

const COLOR_MAP: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

const HEALTH_RING: Record<string, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  planning: "#4f4f4d",
  active: "#5591C7",
  on_hold: "#E8AF34",
  completed: "#6DAA45",
};

const PROJECT_TYPE_BADGE: Record<
  ProjectType,
  { icon: string; label: string }
> = {
  event: { icon: "🎯", label: "Event" },
  product: { icon: "📱", label: "Product" },
  education: { icon: "📚", label: "Education" },
  publication: { icon: "📰", label: "Publication" },
  hackathon: { icon: "⚡", label: "Hackathon" },
  collaboration: { icon: "🤝", label: "Collaboration" },
  internal_software: { icon: "🔧", label: "Internal" },
};

export const ProjectClusterNode = React.memo(function ProjectClusterNode({
  data,
}: NodeProps) {
  const nodeData = data as ProjectClusterNodeData;
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const isZ1 = zoomLevel === "Z1";

  const selectNode = useCanvasStore((s) => s.selectNode);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (e.defaultPrevented) return;
      selectNode(`project-${nodeData.project.id}`, "project");
    },
    [selectNode, nodeData.project.id],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      nodeData.onToggleExpand(nodeData.project.id);
    },
    [nodeData],
  );

  const accentColor = COLOR_MAP[nodeData.project.color] ?? "#5591C7";
  const phaseCount = nodeData.project.phases.length;
  const taskCount = nodeData.project.phases.reduce(
    (sum, ph) => sum + ph.taskCount,
    0,
  );

  const projectType = nodeData.projectType ?? "event";
  const typeBadge = PROJECT_TYPE_BADGE[projectType];
  const health = nodeData.health;
  const ringColor = health
    ? HEALTH_RING[health.grade]
    : accentColor;
  const completion = nodeData.project.completionPercent;
  const circumference = 2 * Math.PI * 18;
  const strokeDash = (completion / 100) * circumference;

  const partnerOrgs = nodeData.partnerOrgs ?? [];
  const visiblePartners = partnerOrgs.slice(0, 2);
  const overflowPartners = partnerOrgs.length - visiblePartners.length;

  const upcoming = nodeData.upcomingMilestone;
  const milestoneStripClass =
    upcoming && upcoming.daysUntil <= 7
      ? "text-[#DD6974]"
      : upcoming && upcoming.daysUntil <= 30
        ? "text-[#E8AF34]"
        : "text-on-surface-variant";

  const healthTooltip = health
    ? `Health: ${health.score}/100 — ${health.blockedCriticalTasks} blocked critical, ${health.overdueTaskCount} overdue tasks`
    : undefined;

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectNode(`project-${nodeData.project.id}`, "project");
        }
      }}
      style={{ cursor: "pointer", borderColor: `${accentColor}4D` }}
      className={[
        `relative overflow-hidden rounded-xl border ${colors.bg.elevated} transition-shadow hover:shadow-md`,
        isZ1 ? "w-[260px]" : "min-h-[48px] w-[200px]",
      ].join(" ")}
    >
      <div
        className="absolute left-0 right-0 top-0 h-[3px] rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />
      {health ? (
        <div
          className="absolute bottom-0 left-0 h-1 rounded-b-xl"
          style={{
            width: `${health.score}%`,
            backgroundColor:
              health.score > 80
                ? "#6DAA45"
                : health.score >= 50
                  ? "#E8AF34"
                  : "#DD6974",
          }}
        />
      ) : null}

      {typeBadge && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80">
          <span aria-hidden>{typeBadge.icon}</span>
          <span>{typeBadge.label}</span>
        </div>
      )}

      <div className={`flex h-full flex-col ${isZ1 ? "pt-6" : "py-3 pl-5 pr-3 pt-8"}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-headline-sm truncate font-semibold text-on-surface">
            {nodeData.project.name}
          </p>
          {!isZ1 && health && (
            <div
              className="relative h-11 w-11 shrink-0"
              title={healthTooltip}
            >
              <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="3"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-mono-label absolute inset-0 flex items-center justify-center text-[9px] text-on-surface">
                {Math.round(completion)}%
              </span>
            </div>
          )}
          {isZ1 ? (
            <button
              type="button"
              onClick={handleToggle}
              className="shrink-0 text-on-surface-variant transition-transform duration-150 hover:text-on-surface"
              aria-label={
                nodeData.isExpanded ? "Collapse project" : "Expand project"
              }
            >
              <ChevronRight
                size={16}
                className={[
                  "transition-transform duration-150",
                  nodeData.isExpanded ? "rotate-90" : "",
                ].join(" ")}
              />
            </button>
          ) : null}
        </div>

        {nodeData.isCollaborative && visiblePartners.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {visiblePartners.map((name) => (
              <span
                key={name}
                className="rounded-full bg-[#E8AF34]/10 px-1.5 py-0.5 text-[10px] text-[#E8AF34]"
              >
                🤝 {name}
              </span>
            ))}
            {overflowPartners > 0 && (
              <span className="text-[10px] text-on-surface-variant">
                +{overflowPartners} more
              </span>
            )}
          </div>
        )}

        <div className="mt-1 flex items-center gap-1.5">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: STATUS_DOT_COLOR[nodeData.project.status],
            }}
          />
          <span className="text-body-sm capitalize text-on-surface-variant">
            {nodeData.project.status.replace("_", " ")}
          </span>
        </div>

        {isZ1 && (
          <div className="mt-2 flex items-center gap-2">
            {health && (
              <div className="relative h-9 w-9 shrink-0" title={healthTooltip}>
                <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${(completion / 100) * (2 * Math.PI * 14)} ${2 * Math.PI * 14}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono-label absolute inset-0 flex items-center justify-center text-[8px]">
                  {Math.round(completion)}%
                </span>
              </div>
            )}
            <p className="font-mono-label text-[10px] text-on-surface-variant">
              {phaseCount} phases · {taskCount} tasks
            </p>
          </div>
        )}

        {upcoming && (
          <p
            className={`mt-2 border-t border-white/5 pt-2 text-[10px] ${milestoneStripClass}`}
          >
            📅 {upcoming.title} — in {upcoming.daysUntil}d
          </p>
        )}
      </div>
    </div>
  );
});
