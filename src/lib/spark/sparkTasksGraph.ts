import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import type {
  ApiDependency,
  ApiPhase,
  ApiTask,
  ApiUser,
  OrgGraphResponse,
} from "@/lib/api/types";
import type {
  SparkPhaseHeaderNodeData,
  SparkTaskNodeData,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "@/types";
import { loadLevelFromTaskCount } from "@/lib/userLoadLevel";

const COL_X = [0, 420, 840];
const PHASE_TOP = 0;
const TASK_TOP = 120;
const TASK_ROW_GAP = 180;
const NODE_W = 200;
const TASK_X_OFFSET = 60;

export const SPARKIT_PROJECT_NAME = "SparkIT'26";

function toUser(apiUser: ApiUser, taskCount: number): User {
  return {
    id: apiUser.id,
    orgId: apiUser.orgId,
    name: apiUser.name,
    initials: apiUser.initials,
    email: apiUser.email,
    role: apiUser.role,
    avatarUrl: apiUser.avatarUrl ?? undefined,
    loadLevel: loadLevelFromTaskCount(taskCount),
    taskCount,
    loadPercent: taskCount * 12.5,
  };
}

export function apiTaskToDomain(
  api: ApiTask,
  isCriticalPath: boolean,
): Task {
  return {
    id: api.id,
    phaseId: api.phaseId,
    projectId: api.projectId,
    title: api.title,
    description: api.description ?? undefined,
    status: api.status as TaskStatus,
    priority: api.priority as TaskPriority,
    assigneeIds: api.assigneeIds,
    effortEstimate: api.effortEstimate ?? undefined,
    dueDate: api.dueDate ? new Date(`${api.dueDate}T00:00:00`) : undefined,
    canvasX: api.canvasX,
    canvasY: api.canvasY,
    isCriticalPath,
    dependencies: api.dependencies,
    dependents: api.dependents,
  };
}

function phaseCompletionRate(tasks: ApiTask[]): number {
  if (tasks.length === 0) return 0;
  return tasks.filter((t) => t.status === "done").length / tasks.length;
}

function countPendingUpstream(
  task: ApiTask,
  taskById: Map<string, ApiTask>,
): number {
  return task.dependencies.filter((depId) => {
    const upstream = taskById.get(depId);
    return upstream && upstream.status !== "done";
  }).length;
}

export type SparkGraphBuildOptions = {
  hoveredTaskId: string | null;
  emphasizeCriticalPath: boolean;
  unlockPulseTaskIds: Set<string>;
  completeGlowPhaseIds: Set<string>;
};

export function buildSparkTasksGraph(
  data: OrgGraphResponse,
  options: SparkGraphBuildOptions,
): { nodes: Node[]; edges: Edge[]; stats: SparkCanvasStats } {
  const sparkit = data.projects.find((p) => p.name === SPARKIT_PROJECT_NAME);
  if (!sparkit) {
    return {
      nodes: [],
      edges: [],
      stats: { total: 0, done: 0, inProgress: 0 },
    };
  }

  const phases = data.phases
    .filter((p) => p.projectId === sparkit.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const sparkTasks = data.tasks.filter((t) => t.projectId === sparkit.id);
  const taskById = new Map(sparkTasks.map((t) => [t.id, t]));

  const tasksByPhase = new Map<string, ApiTask[]>();
  for (const phase of phases) {
    tasksByPhase.set(phase.id, []);
  }
  for (const task of sparkTasks) {
    if (task.phaseId) {
      tasksByPhase.get(task.phaseId)?.push(task);
    }
  }
  for (const [, list] of tasksByPhase) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  const cpmTasks: CPMTask[] = sparkTasks.map((t) => ({
    id: t.id,
    duration: Math.max(1, t.effortEstimate ?? 8),
    dependencies: t.dependencies,
    dependents: t.dependents,
    status: t.status,
  }));
  const cpmResult = computeCPM(cpmTasks);

  const completionByPhase = new Map(
    phases.map((ph) => [ph.id, phaseCompletionRate(tasksByPhase.get(ph.id) ?? [])]),
  );

  const phaseLocked = (phase: ApiPhase, index: number): boolean => {
    if (index === 0) return false;
    const prev = phases[index - 1];
    if (!prev) return false;
    return (completionByPhase.get(prev.id) ?? 0) < 0.6;
  };

  const taskCountByUser = new Map<string, number>();
  for (const t of sparkTasks) {
    for (const uid of t.assigneeIds) {
      taskCountByUser.set(uid, (taskCountByUser.get(uid) ?? 0) + 1);
    }
  }
  const userMap = new Map(
    data.users.map((u) => [
      u.id,
      toUser(u, taskCountByUser.get(u.id) ?? 0),
    ]),
  );

  const upstreamHighlightIds = new Set<string>();
  if (options.hoveredTaskId) {
    const hovered = taskById.get(options.hoveredTaskId);
    if (hovered) {
      for (const depId of hovered.dependencies) {
        upstreamHighlightIds.add(depId);
      }
    }
  }

  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];

  phases.forEach((phase, colIndex) => {
    const colX = COL_X[colIndex] ?? colIndex * (NODE_W + 80);
    const phaseTasks = tasksByPhase.get(phase.id) ?? [];
    const doneTasks = phaseTasks.filter((t) => t.status === "done").length;
    const locked = phaseLocked(phase, colIndex);

    flowNodes.push({
      id: `spark-phase-${phase.id}`,
      type: "sparkPhaseHeader",
      position: { x: colX + TASK_X_OFFSET, y: PHASE_TOP },
      data: {
        phaseName: phase.name,
        taskCount: phaseTasks.length,
        doneCount: doneTasks,
        isLocked: locked,
        showCompleteGlow: options.completeGlowPhaseIds.has(phase.id),
      } satisfies SparkPhaseHeaderNodeData,
      draggable: false,
      selectable: false,
    });

    phaseTasks.forEach((apiTask, rowIndex) => {
      const cpmNode = cpmResult.nodes[apiTask.id];
      const isCriticalPath = cpmNode?.isCriticalPath ?? false;
      const task = apiTaskToDomain(apiTask, isCriticalPath);
      const assignees = apiTask.assigneeIds
        .map((id) => userMap.get(id))
        .filter((u): u is User => Boolean(u));

      flowNodes.push({
        id: `spark-task-${apiTask.id}`,
        type: "sparkTask",
        position: {
          x: colX + TASK_X_OFFSET,
          y: TASK_TOP + rowIndex * TASK_ROW_GAP,
        },
        data: {
          task,
          assignees,
          isCriticalPath,
          phaseLocked: locked,
          upstreamPendingCount: countPendingUpstream(apiTask, taskById),
          isUpstreamHighlighted: upstreamHighlightIds.has(apiTask.id),
          showUnlockPulse: options.unlockPulseTaskIds.has(apiTask.id),
          dimmedNonCritical:
            options.emphasizeCriticalPath && !isCriticalPath,
        } satisfies SparkTaskNodeData,
      });
    });
  });

  const deps: ApiDependency[] = data.dependencies ?? [];
  for (const dep of deps) {
    const sourceTask = taskById.get(dep.upstreamTaskId);
    const targetTask = taskById.get(dep.downstreamTaskId);
    if (!sourceTask || !targetTask) continue;

    const sourceIsCritical = cpmResult.nodes[sourceTask.id]?.isCriticalPath ?? false;
    const targetIsCritical = cpmResult.nodes[targetTask.id]?.isCriticalPath ?? false;
    const isCrossPhase = sourceTask.phaseId !== targetTask.phaseId;

    const isChainEdge =
      options.hoveredTaskId != null &&
      dep.downstreamTaskId === options.hoveredTaskId;

    if (
      options.emphasizeCriticalPath &&
      !(sourceIsCritical && targetIsCritical)
    ) {
      continue;
    }

    const marching =
      sourceTask.status === "in_progress" &&
      !(sourceIsCritical && targetIsCritical);

    flowEdges.push({
      id: `spark-dep-${dep.upstreamTaskId}-${dep.downstreamTaskId}`,
      source: `spark-task-${dep.upstreamTaskId}`,
      target: `spark-task-${dep.downstreamTaskId}`,
      type: "sparkDependency",
      animated: marching,
      data: {
        sourceStatus: sourceTask.status,
        isCriticalPath: sourceIsCritical && targetIsCritical,
        isCrossPhase,
        sourcePhaseId: sourceTask.phaseId,
        targetPhaseId: targetTask.phaseId,
        dimmed: options.hoveredTaskId != null && !isChainEdge,
        highlighted: isChainEdge,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "rgba(255,255,255,0.25)",
        width: 12,
        height: 12,
      },
    });
  }

  const stats: SparkCanvasStats = {
    total: sparkTasks.length,
    done: sparkTasks.filter((t) => t.status === "done").length,
    inProgress: sparkTasks.filter((t) => t.status === "in_progress").length,
  };

  return { nodes: flowNodes, edges: flowEdges, stats };
}

export type SparkCanvasStats = {
  total: number;
  done: number;
  inProgress: number;
};
