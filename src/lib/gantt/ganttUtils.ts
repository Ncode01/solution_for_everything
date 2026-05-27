import type { OrgGraphResponse } from "@/lib/api/types";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";

export type GanttZoomLevel = "week" | "month" | "quarter";

export interface GanttBar {
  taskId: string;
  title: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  phaseId: string;
  phaseName: string;
  phaseOrderIndex: number;
  status: string;
  priority: string;
  isCriticalPath: boolean;
  durationDays: number;
  startDay: number;
  endDay: number;
  dueDateDay: number | null;
  assigneeInitials: string[];
}

export interface GanttPhaseGroup {
  phaseId: string;
  phaseName: string;
  phaseOrderIndex: number;
  projectId: string;
  projectName: string;
  projectColor: string;
  bars: GanttBar[];
}

export const PROJECT_COLOR_HEX: Record<string, string> = {
  coral: "#E05C5C",
  amber: "#E8AF34",
  violet: "#A86FDF",
  sky: "#5591C7",
  mint: "#6DAA45",
};

function dayDiff(origin: Date, dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const o = new Date(origin);
  o.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - o.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildGanttData(
  graph: OrgGraphResponse,
  _zoomLevel: GanttZoomLevel,
): { groups: GanttPhaseGroup[]; totalDays: number; originDate: Date } {
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
  const projectById = new Map(graph.projects.map((p) => [p.id, p] as const));
  const phaseById = new Map(graph.phases.map((p) => [p.id, p] as const));

  let earliestStart = Infinity;
  for (const task of graph.tasks) {
    const node = cpmResult.nodes[task.id];
    if (node && node.earlyStart < earliestStart) {
      earliestStart = node.earlyStart;
    }
  }

  const originDate = new Date();
  originDate.setHours(0, 0, 0, 0);
  if (earliestStart !== Infinity && earliestStart > 0) {
    const offsetMs = earliestStart * 0.125 * 24 * 60 * 60 * 1000;
    originDate.setTime(originDate.getTime() - offsetMs);
  }

  const groupMap = new Map<string, GanttPhaseGroup>();
  let maxEndDay = 1;

  for (const task of graph.tasks) {
    const project = projectById.get(task.projectId);
    const phase = phaseById.get(task.phaseId);
    if (!project || !phase) continue;

    const cpmNode = cpmResult.nodes[task.id];
    const effort = task.effortEstimate ?? 8;
    const durationDays = Math.max(1, Math.ceil(effort / 8));
    const startDay = (cpmNode?.earlyStart ?? 0) * 0.125;
    const endDay = startDay + durationDays;

    if (endDay > maxEndDay) maxEndDay = endDay;

    const projectColor =
      PROJECT_COLOR_HEX[project.color] ?? PROJECT_COLOR_HEX.sky;

    const bar: GanttBar = {
      taskId: task.id,
      title: task.title,
      projectId: project.id,
      projectName: project.name,
      projectColor,
      phaseId: phase.id,
      phaseName: phase.name,
      phaseOrderIndex: phase.orderIndex,
      status: task.status,
      priority: task.priority,
      isCriticalPath: cpmNode?.isCriticalPath ?? false,
      durationDays,
      startDay,
      endDay,
      dueDateDay: task.dueDate ? dayDiff(originDate, task.dueDate) : null,
      assigneeInitials: task.assigneeIds
        .map((id) => userInitials.get(id))
        .filter((v): v is string => Boolean(v)),
    };

    const key = phase.id;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        phaseId: phase.id,
        phaseName: phase.name,
        phaseOrderIndex: phase.orderIndex,
        projectId: project.id,
        projectName: project.name,
        projectColor,
        bars: [],
      });
    }
    groupMap.get(key)!.bars.push(bar);
  }

  const groups = [...groupMap.values()]
    .map((g) => ({
      ...g,
      bars: [...g.bars].sort((a, b) => a.startDay - b.startDay),
    }))
    .sort((a, b) => {
      const projCmp = a.projectName.localeCompare(b.projectName);
      if (projCmp !== 0) return projCmp;
      return a.phaseOrderIndex - b.phaseOrderIndex;
    });

  const totalDays = Math.ceil(maxEndDay * 1.1);

  return { groups, totalDays, originDate };
}
