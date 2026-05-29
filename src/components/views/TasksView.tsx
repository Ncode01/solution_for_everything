"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { colors, typography, buttonVariants } from "@/design-system";
import { skeletonVariants } from "@/design-system/components";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import type { ApiTask, ApiUser } from "@/lib/api/types";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import { getUserColor } from "@/lib/presence/userColor";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { formatQueryError } from "@/lib/formatQueryError";

const PROJECT_COLOR_DOT: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#E8AF34]",
  violet: "bg-[#A86FDF]",
  sky: "bg-[#5591C7]",
  mint: "bg-[#6DAA45]",
};

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "not_started", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
] as const;

function formatDueShort(due: string | null): string {
  if (!due) return "—";
  const d = new Date(`${due}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusDotClass(status: string): string {
  switch (status) {
    case "in_progress":
      return "bg-primary";
    case "blocked":
      return "bg-[#E8AF34] animate-pulse";
    case "done":
      return "bg-[#6DAA45]";
    case "in_review":
      return "bg-[#A86FDF]";
    default:
      return "bg-outline";
  }
}

export function TasksView() {
  const graph = useOrgGraphData();
  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const openTaskView = useUIStore((s) => s.openTaskView);

  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const projects = graph.data?.projects ?? [];
  const tasks = graph.data?.tasks ?? [];
  const users = graph.data?.users ?? [];

  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (
        assigneeFilter !== "all" &&
        !t.assigneeIds.includes(assigneeFilter)
      ) {
        return false;
      }
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, projectFilter, statusFilter, assigneeFilter, search]);

  const grouped = useMemo(() => {
    return projects
      .map((project) => ({
        project,
        tasks: filteredTasks.filter((t) => t.projectId === project.id),
      }))
      .filter((g) => g.tasks.length > 0 || projectFilter === "all");
  }, [projects, filteredTasks, projectFilter]);

  const toggleGroup = (projectId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleTaskClick = (taskId: string) => {
    selectNode(`task-${taskId}`, "task");
    openTaskView();
    useUIStore.getState().setActiveView("canvas");
    void focusCanvasNode(`task-${taskId}`);
  };

  if (graph.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className={`h-10 max-w-lg ${skeletonVariants.base}`} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-24 ${skeletonVariants.base}`} />
        ))}
      </div>
    );
  }

  if (graph.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(graph.error)}
        onRetry={() => graph.refetch()}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
          Create a task with ⌘T
        </p>
        <button
          type="button"
          className={buttonVariants.primary}
          onClick={() => openTaskCreate()}
        >
          Create Task
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={`flex flex-wrap items-center gap-3 border-b px-6 py-4 ${colors.border.subtle}`}
      >
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="Filter by project"
          className={`rounded-lg border px-3 py-1.5 ${colors.bg.elevated} ${colors.border.subtle} ${typography.scale.sm.class}`}
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={`rounded-lg border px-3 py-1.5 ${colors.bg.elevated} ${colors.border.subtle} ${typography.scale.sm.class}`}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAssigneeFilter("all")}
            className={`rounded-full px-2 py-1 ${typography.scale.xs.class} ${assigneeFilter === "all" ? "bg-[#6366F1]/20" : colors.bg.elevated}`}
          >
            All
          </button>
          {users.slice(0, 8).map((u) => (
            <button
              key={u.id}
              type="button"
              title={u.name}
              onClick={() => setAssigneeFilter(u.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ${assigneeFilter === u.id ? "ring-[#6366F1]" : "ring-transparent"}`}
              style={{ backgroundColor: getUserColor(u.id) }}
            >
              {u.initials}
            </button>
          ))}
        </div>
        <div
          className={`ml-auto flex items-center gap-2 rounded-lg border px-3 py-1.5 ${colors.bg.elevated} ${colors.border.subtle}`}
        >
          <Search size={14} className={colors.text.tertiary} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className={`w-44 bg-transparent outline-none ${typography.scale.sm.class}`}
          />
        </div>
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto p-6">
        {grouped.length === 0 ? (
          <p className={`${typography.scale.sm.class} ${colors.text.tertiary}`}>
            No tasks match your filters.
          </p>
        ) : (
          grouped.map(({ project, tasks: groupTasks }) => {
            const isCollapsed = collapsed.has(project.id);
            const dot =
              PROJECT_COLOR_DOT[project.color] ?? PROJECT_COLOR_DOT.sky;
            return (
              <section key={project.id} className="mb-6">
                <button
                  type="button"
                  onClick={() => toggleGroup(project.id)}
                  className="mb-2 flex w-full items-center gap-2"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} className={colors.text.tertiary} />
                  ) : (
                    <ChevronDown size={16} className={colors.text.tertiary} />
                  )}
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className={`${typography.scale.sm.class} font-medium text-white`}>
                    {project.name}
                  </span>
                  <span className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
                    {groupTasks.length}
                  </span>
                </button>
                {!isCollapsed ? (
                  groupTasks.length === 0 ? (
                    <p className={`ml-6 ${typography.scale.sm.class} ${colors.text.tertiary}`}>
                      No tasks in this project
                    </p>
                  ) : (
                    <ul className="ml-2 space-y-1">
                      {groupTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          users={userById}
                          projectColor={project.color}
                          onClick={() => handleTaskClick(task.id)}
                        />
                      ))}
                    </ul>
                  )
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  users,
  projectColor,
  onClick,
}: {
  task: ApiTask;
  users: Map<string, ApiUser>;
  projectColor: string;
  onClick: () => void;
}) {
  const assignee = task.assigneeIds[0]
    ? users.get(task.assigneeIds[0])
    : undefined;
  const depCount = task.dependencies.length;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.04] ${typography.scale.sm.class}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(task.status)}`} />
        <span className="min-w-0 flex-1 truncate text-left text-white">
          {task.title}
        </span>
        {assignee ? (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: getUserColor(assignee.id) }}
            title={assignee.name}
          >
            {assignee.initials}
          </span>
        ) : null}
        <span className={`shrink-0 ${typography.scale.xs.class} ${colors.text.tertiary}`}>
          {formatDueShort(task.dueDate)}
        </span>
        {task.priority !== "medium" ? (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 ${typography.scale.xs.class} ${colors.bg.elevated} ${colors.text.secondary}`}
          >
            {task.priority}
          </span>
        ) : null}
        {depCount > 0 ? (
          <span className={`shrink-0 text-[#E8AF34] ${typography.scale.xs.class}`}>
            ⤵{depCount}
          </span>
        ) : null}
        {task.status === "blocked" ? (
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#DD6974]" title="Blocked" />
        ) : null}
        <span
          className={`hidden h-2 w-2 shrink-0 rounded-full sm:inline ${PROJECT_COLOR_DOT[projectColor] ?? ""}`}
          aria-hidden
        />
      </button>
    </li>
  );
}
