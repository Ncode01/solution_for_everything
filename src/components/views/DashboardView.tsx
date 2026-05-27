"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";
import {
  getBlockedTasksSummary,
  getCriticalPathSummary,
  getProjectHealthData,
  getWorkloadData,
} from "@/lib/dashboard/dashboardUtils";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
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
  const query = useQuery({
    queryKey: ["org-graph", ORG_ID],
    queryFn: () => apiClient.getOrgGraph(ORG_ID),
    enabled: ORG_ID.length > 0,
    staleTime: 30_000,
  });
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const updatedLabel = formatUpdatedAgo(query.dataUpdatedAt);

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

  if (!query.data || query.data.projects.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-surface-container-low">
        <LayoutDashboard size={32} className="text-outline" />
        <p className="text-body-md text-on-surface-variant">No project data</p>
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
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

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
    </main>
  );
}
