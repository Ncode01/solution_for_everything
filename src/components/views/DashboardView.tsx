"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { formatQueryError } from "@/lib/formatQueryError";
import {
  getBlockedTasksSummary,
  getCriticalPathSummary,
  getProjectHealthData,
  getWorkloadData,
} from "@/lib/dashboard/dashboardUtils";
import { computeProjectHealth } from "@/lib/health-score";
import { colors, typography } from "@/design-system";
import { getUserColor } from "@/lib/presence/userColor";
import type { ApiTask } from "@/lib/api/types";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { ProjectHealthCard } from "@/components/dashboard/ProjectHealthCard";
import { WorkloadChart } from "@/components/dashboard/WorkloadChart";
import { CriticalPathPanel } from "@/components/dashboard/CriticalPathPanel";
import { BlockedTasksPanel } from "@/components/dashboard/BlockedTasksPanel";

function formatUpdatedAgo(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function HealthCardSkeleton() {
  return (
    <div className="min-w-[260px] max-w-[380px] flex-1 animate-pulse rounded-xl border border-white/[0.07] bg-surface-container p-5">
      <div className="mb-3 h-4 w-2/3 rounded bg-white/10" />
      <div className="mb-4 h-1 w-full rounded bg-white/10" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10" />
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const query = useOrgGraphData();
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const updatedLabel = formatUpdatedAgo(query.dataUpdatedAt);

  const stats = useMemo(() => {
    if (!query.data) return null;
    const tasks = query.data.tasks;
    const budgetTotal = Object.values(query.data.budgetByProject ?? {}).reduce(
      (sum, b) => sum + (b.summary?.totalIncome ?? 0),
      0,
    );
    return {
      totalTasks: tasks.length,
      completed: tasks.filter((t) => t.status === "done").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      projects: query.data.projects.length,
      members: query.data.users.length,
      budgetTotal,
      milestones: query.data.milestones?.length ?? 0,
    };
  }, [query.data]);

  const recentTasks = useMemo(() => {
    if (!query.data) return [];
    return [...query.data.tasks]
      .sort((a, b) => {
        const au = (a as ApiTask & { updatedAt?: string }).updatedAt ?? "";
        const bu = (b as ApiTask & { updatedAt?: string }).updatedAt ?? "";
        return bu.localeCompare(au);
      })
      .slice(0, 5);
  }, [query.data]);

  const healthBars = useMemo(() => {
    if (!query.data) return [];
    return query.data.projects.map((project) => {
      const projectTasks = query.data!.tasks.filter(
        (t) => t.projectId === project.id,
      );
      const projectMilestones = (query.data!.milestones ?? []).filter(
        (m) => m.projectId === project.id,
      );
      const budget = query.data!.budgetByProject?.[project.id]?.summary ?? null;
      const health = computeProjectHealth(
        projectTasks.map((t) => ({
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
        projectMilestones.map((m) => ({ date: String(m.date) })),
        budget,
      );
      return { project, score: health.score };
    });
  }, [query.data]);

  const { healthCards, workload, criticalPath, blocked } = useMemo(() => {
    if (!query.data) {
      return {
        healthCards: [],
        workload: [],
        criticalPath: [],
        blocked: [],
      };
    }
    return {
      healthCards: getProjectHealthData(query.data),
      workload: getWorkloadData(query.data),
      criticalPath: getCriticalPathSummary(query.data),
      blocked: getBlockedTasksSummary(query.data),
    };
  }, [query.data]);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      selectNode(`task-${taskId}`, "task");
      openTaskView();
      useUIStore.getState().setActiveView("canvas");
    },
    [selectNode, openTaskView],
  );

  if (query.isLoading) {
    return (
      <main className="hide-scrollbar flex-1 overflow-y-auto bg-surface-container-low p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="flex flex-wrap gap-3">
          <HealthCardSkeleton />
          <HealthCardSkeleton />
          <HealthCardSkeleton />
        </div>
      </main>
    );
  }

  if (query.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (!query.data || query.data.projects.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-surface-container-low">
        <LayoutDashboard size={32} className="text-outline" aria-hidden />
        <p className="text-body-md text-on-surface">No project data</p>
        <p className="text-body-sm text-on-surface-variant">
          Create projects and tasks on the canvas to see dashboard KPIs.
        </p>
        <button
          type="button"
          onClick={() => useUIStore.getState().setActiveView("canvas")}
          className="text-body-sm mt-2 rounded-lg border border-white/10 px-4 py-2 text-on-surface hover:bg-white/5"
        >
          Open canvas
        </button>
      </main>
    );
  }

  return (
    <main className="hide-scrollbar flex-1 overflow-y-auto bg-surface-container-low p-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-headline-sm font-medium text-on-surface">
          Dashboard
        </h1>
        <span className="font-mono-label rounded-full border border-white/10 px-3 py-1 text-mono-label text-on-surface-variant">
          Updated {updatedLabel}
        </span>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-body-sm text-on-surface-variant hover:bg-white/5"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={14} aria-hidden />
          Refresh
        </button>
      </header>

      {stats ? (
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <StatCard label="Total Tasks" value={stats.totalTasks} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="In Progress" value={stats.inProgress} />
          <StatCard label="Blocked" value={stats.blocked} />
          <StatCard label="Projects" value={stats.projects} />
          <StatCard label="Team Members" value={stats.members} />
          <StatCard
            label="Budget Total"
            value={stats.budgetTotal.toLocaleString()}
          />
          <StatCard label="Milestones" value={stats.milestones} />
        </section>
      ) : null}

      <section className="mb-6 flex flex-wrap gap-3">
        {healthCards.map((card) => (
          <ProjectHealthCard key={card.projectId} card={card} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WorkloadChart data={workload} />
        <CriticalPathPanel
          items={criticalPath}
          onTaskClick={handleTaskClick}
        />
        <BlockedTasksPanel items={blocked} onTaskClick={handleTaskClick} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-section-header text-on-surface-variant">
          Health Scores
        </h2>
        <ul className="space-y-3">
          {healthBars.map(({ project, score }) => (
            <li key={project.id}>
              <div className="mb-1 flex justify-between text-body-sm text-on-surface">
                <span>{project.name}</span>
                <span className="font-mono-label text-mono-label">{score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${
                    score > 80
                      ? "bg-[#6DAA45]"
                      : score >= 50
                        ? "bg-[#E8AF34]"
                        : "bg-[#DD6974]"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-section-header text-on-surface-variant">
          Recent Activity
        </h2>
        {recentTasks.length === 0 ? (
          <p className={`${typography.scale.sm.class} ${colors.text.tertiary}`}>
            No recent task updates.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {recentTasks.map((task) => {
              const project = query.data!.projects.find(
                (p) => p.id === task.projectId,
              );
              const assignee = query.data!.users.find((u) =>
                task.assigneeIds.includes(u.id),
              );
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => handleTaskClick(task.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        project?.color === "coral"
                          ? "bg-[#E05C5C]"
                          : project?.color === "mint"
                            ? "bg-[#6DAA45]"
                            : "bg-[#5591C7]"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate text-body-sm text-on-surface">
                      {task.title}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-on-surface-variant">
                      {task.status.replace("_", " ")}
                    </span>
                    {assignee ? (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: getUserColor(assignee.id) }}
                      >
                        {assignee.initials}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface-container-high p-4">
      <p className="text-section-header text-on-surface-variant">{label}</p>
      <p className="mt-1 text-display-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}
