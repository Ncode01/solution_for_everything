import type { OrgGraphResponse } from "@/lib/api/types";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";

export interface ProjectHealthCard {
  projectId: string;
  projectName: string;
  projectColor: string;
  completionPercent: number;
  status: string;
  totalTasks: number;
  doneTasks: number;
  blockedCount: number;
  overdueCount: number;
  criticalPathCount: number;
  teamSize: number;
}

export interface WorkloadBar {
  userId: string;
  name: string;
  initials: string;
  totalEffortHours: number;
  byStatus: {
    done: number;
    in_progress: number;
    not_started: number;
    blocked: number;
    in_review: number;
  };
}

export interface CriticalPathItem {
  taskId: string;
  title: string;
  projectName: string;
  status: string;
  effortHours: number;
  slackDays: number;
  assigneeInitials: string[];
  dueDate: string | null;
}

export interface BlockedTaskItem {
  taskId: string;
  title: string;
  projectName: string;
  blockers: string[];
  assigneeInitials: string[];
}

const PROJECT_COLOR_HEX: Record<string, string> = {
  coral: "#E05C5C",
  amber: "#E8AF34",
  violet: "#A86FDF",
  sky: "#5591C7",
  mint: "#6DAA45",
};

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function getProjectHealthData(
  graph: OrgGraphResponse,
): ProjectHealthCard[] {
  const cpmTasks: CPMTask[] = graph.tasks.map((t) => ({
    id: t.id,
    duration: t.effortEstimate ?? 8,
    dependencies: t.dependencies,
    dependents: t.dependents,
    status: t.status,
  }));
  const cpmResult = computeCPM(cpmTasks);

  return graph.projects.map((project) => {
    const tasks = graph.tasks.filter((t) => t.projectId === project.id);
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const assigneeSet = new Set<string>();
    for (const t of tasks) {
      for (const id of t.assigneeIds) assigneeSet.add(id);
    }

    return {
      projectId: project.id,
      projectName: project.name,
      projectColor: PROJECT_COLOR_HEX[project.color] ?? PROJECT_COLOR_HEX.sky,
      completionPercent: project.completionPercent,
      status: project.status,
      totalTasks: tasks.length,
      doneTasks,
      blockedCount: tasks.filter((t) => t.status === "blocked").length,
      overdueCount: tasks.filter((t) =>
        isOverdue(t.dueDate, t.status),
      ).length,
      criticalPathCount: tasks.filter(
        (t) => cpmResult.nodes[t.id]?.isCriticalPath,
      ).length,
      teamSize: assigneeSet.size,
    };
  });
}

export function getWorkloadData(graph: OrgGraphResponse): WorkloadBar[] {
  const byUser = new Map<string, WorkloadBar>();

  for (const user of graph.users) {
    byUser.set(user.id, {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      totalEffortHours: 0,
      byStatus: {
        done: 0,
        in_progress: 0,
        not_started: 0,
        blocked: 0,
        in_review: 0,
      },
    });
  }

  for (const task of graph.tasks) {
    const effort = task.effortEstimate ?? 0;
    const statusKey = task.status as keyof WorkloadBar["byStatus"];
    for (const userId of task.assigneeIds) {
      const row = byUser.get(userId);
      if (!row) continue;
      row.totalEffortHours += effort;
      if (statusKey in row.byStatus) {
        row.byStatus[statusKey] += effort;
      }
    }
  }

  return [...byUser.values()]
    .filter((r) => r.totalEffortHours > 0)
    .sort((a, b) => b.totalEffortHours - a.totalEffortHours);
}

export function getCriticalPathSummary(
  graph: OrgGraphResponse,
): CriticalPathItem[] {
  const cpmTasks: CPMTask[] = graph.tasks.map((t) => ({
    id: t.id,
    duration: t.effortEstimate ?? 8,
    dependencies: t.dependencies,
    dependents: t.dependents,
    status: t.status,
  }));
  const cpmResult = computeCPM(cpmTasks);
  const userInitials = new Map(
    graph.users.map((u) => [u.id, u.initials] as const),
  );
  const projectName = new Map(
    graph.projects.map((p) => [p.id, p.name] as const),
  );

  const items: CriticalPathItem[] = [];
  for (const task of graph.tasks) {
    const node = cpmResult.nodes[task.id];
    if (!node?.isCriticalPath) continue;
    items.push({
      taskId: task.id,
      title: task.title,
      projectName: projectName.get(task.projectId) ?? "",
      status: task.status,
      effortHours: task.effortEstimate ?? 8,
      slackDays: Math.round(node.float / 8),
      assigneeInitials: task.assigneeIds
        .map((id) => userInitials.get(id))
        .filter((v): v is string => Boolean(v)),
      dueDate: task.dueDate,
    });
  }

  return items.sort((a, b) => a.slackDays - b.slackDays);
}

export function getBlockedTasksSummary(
  graph: OrgGraphResponse,
): BlockedTaskItem[] {
  const titleById = new Map(graph.tasks.map((t) => [t.id, t.title] as const));
  const projectName = new Map(
    graph.projects.map((p) => [p.id, p.name] as const),
  );
  const userInitials = new Map(
    graph.users.map((u) => [u.id, u.initials] as const),
  );

  const items: BlockedTaskItem[] = graph.tasks
    .filter((t) => t.status === "blocked")
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      projectName: projectName.get(task.projectId) ?? "",
      blockers: task.dependencies
        .map((id) => titleById.get(id))
        .filter((v): v is string => Boolean(v)),
      assigneeInitials: task.assigneeIds
        .map((id) => userInitials.get(id))
        .filter((v): v is string => Boolean(v)),
    }));

  return items.sort((a, b) => b.blockers.length - a.blockers.length);
}
