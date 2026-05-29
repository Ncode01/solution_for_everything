import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { OrgGraphResponse } from "@/lib/api/types";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import { loadLevelFromTaskCount } from "@/lib/userLoadLevel";
import type {
  Milestone,
  MilestoneNodeData,
  ProjectType,
} from "@/types/project-extensions";
import type {
  PersonAvatarNodeData,
  Phase,
  Project,
  ProjectAccentColor,
  ProjectClusterNodeData,
  ProjectStatus,
  Task,
  TaskCardNodeData,
  TaskPriority,
  TaskStatus,
  User,
} from "@/types";

const PROJECT_COLS = 3;
const PROJECT_COL_WIDTH = 900;
const PROJECT_ROW_HEIGHT = 1100;
const PROJECT_ORIGIN_X = 100;
const PROJECT_ORIGIN_Y = 100;

const TASK_COL_WIDTH = 220;
const TASK_ROW_HEIGHT = 130;
const TASKS_PER_COL = 5;
const PHASE_COL_GAP = 280;

const PERSON_ROW_Y = PROJECT_ORIGIN_Y - 200;

function toFrontendUser(
  apiUser: OrgGraphResponse["users"][number],
  taskCount: number,
): User {
  const loadLevel = loadLevelFromTaskCount(taskCount);
  const loadPercent = taskCount * 12.5;

  return {
    id: apiUser.id,
    orgId: apiUser.orgId,
    name: apiUser.name,
    initials: apiUser.initials,
    email: apiUser.email,
    role: apiUser.role,
    avatarUrl: apiUser.avatarUrl ?? undefined,
    loadLevel,
    taskCount,
    loadPercent,
  };
}

function toFrontendProject(
  apiProject: OrgGraphResponse["projects"][number],
  phases: Phase[],
): Project {
  return {
    id: apiProject.id,
    orgId: apiProject.orgId,
    name: apiProject.name,
    color: (apiProject.color as ProjectAccentColor) ?? "sky",
    status: apiProject.status as ProjectStatus,
    ownerId: apiProject.ownerId ?? "",
    completionPercent: apiProject.completionPercent,
    startDate: apiProject.startDate
      ? new Date(apiProject.startDate)
      : undefined,
    endDate: apiProject.endDate ? new Date(apiProject.endDate) : undefined,
    phases,
    members: [],
  };
}

function pickUpcomingMilestone(
  projectId: string,
  milestoneList: Milestone[],
): Milestone | null {
  const projectMilestones = milestoneList
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const future = projectMilestones.find((m) => m.daysUntil >= 0);
  return future ?? projectMilestones[0] ?? null;
}

function projectGridPosition(
  index: number,
  canvasX: number | null | undefined,
  canvasY: number | null | undefined,
): { x: number; y: number } {
  if (canvasX != null && canvasY != null) {
    return { x: canvasX, y: canvasY };
  }
  const col = index % PROJECT_COLS;
  const row = Math.floor(index / PROJECT_COLS);
  return {
    x: PROJECT_ORIGIN_X + col * PROJECT_COL_WIDTH,
    y: PROJECT_ORIGIN_Y + row * PROJECT_ROW_HEIGHT,
  };
}

function taskNeedsAutoLayout(canvasX: number, canvasY: number): boolean {
  return canvasX === 0 && canvasY === 0;
}

function layoutTasksForProject(
  projectId: string,
  clusterX: number,
  clusterY: number,
  phases: OrgGraphResponse["phases"],
  tasks: OrgGraphResponse["tasks"],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const projectPhases = phases
    .filter((ph) => ph.projectId === projectId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const taskAreaOriginX = clusterX + 30;
  const taskAreaOriginY = clusterY + 220;

  projectPhases.forEach((phase, phaseIndex) => {
    const phaseTasks = tasks
      .filter((t) => t.phaseId === phase.id)
      .sort((a, b) => {
        if (a.canvasX !== b.canvasX) return a.canvasX - b.canvasX;
        return a.canvasY - b.canvasY;
      });

    const phaseColOffset = phaseIndex * (TASK_COL_WIDTH + PHASE_COL_GAP);

    phaseTasks.forEach((task, j) => {
      if (!taskNeedsAutoLayout(task.canvasX, task.canvasY)) {
        positions.set(task.id, { x: task.canvasX, y: task.canvasY });
        return;
      }

      const col = Math.floor(j / TASKS_PER_COL);
      const row = j % TASKS_PER_COL;
      positions.set(task.id, {
        x: taskAreaOriginX + phaseColOffset + col * TASK_COL_WIDTH,
        y: taskAreaOriginY + row * TASK_ROW_HEIGHT,
      });
    });
  });

  return positions;
}

/** Nudge overlapping taskCard nodes apart (Manhattan proximity). */
export function deCollide(nodes: Node[], minDist: number): Node[] {
  const adjusted = nodes.map((node) => ({
    ...node,
    position: { ...node.position },
  }));

  for (let i = 0; i < adjusted.length; i++) {
    for (let j = i + 1; j < adjusted.length; j++) {
      if (adjusted[i].type !== "taskCard" || adjusted[j].type !== "taskCard") {
        continue;
      }
      const dx = Math.abs(adjusted[i].position.x - adjusted[j].position.x);
      const dy = Math.abs(adjusted[i].position.y - adjusted[j].position.y);
      if (dx < minDist && dy < minDist) {
        adjusted[j].position.y += minDist;
      }
    }
  }

  return adjusted;
}

export function buildGraphFromApi(data: OrgGraphResponse): {
  nodes: Node[];
  edges: Edge[];
} {
  const userTaskCount: Record<string, number> = {};
  const userProjectIds: Record<string, Set<string>> = {};

  for (const t of data.tasks) {
    for (const uid of t.assigneeIds) {
      userTaskCount[uid] = (userTaskCount[uid] ?? 0) + 1;
      if (!userProjectIds[uid]) userProjectIds[uid] = new Set();
      userProjectIds[uid].add(t.projectId);
    }
  }

  const userMap: Record<string, User> = {};
  for (const u of data.users) {
    userMap[u.id] = toFrontendUser(u, userTaskCount[u.id] ?? 0);
  }

  const phasesByProject: Record<string, Phase[]> = {};
  for (const p of data.phases) {
    const projectTasks = data.tasks.filter((t) => t.phaseId === p.id);
    const doneCount = projectTasks.filter((t) => t.status === "done").length;
    const phase: Phase = {
      id: p.id,
      projectId: p.projectId,
      name: p.name,
      orderIndex: p.orderIndex,
      completionPercent:
        projectTasks.length > 0
          ? (doneCount / projectTasks.length) * 100
          : 0,
      taskCount: projectTasks.length,
      doneCount,
    };
    if (!phasesByProject[p.projectId]) phasesByProject[p.projectId] = [];
    phasesByProject[p.projectId].push(phase);
  }

  const projectMap: Record<string, Project> = {};
  for (const p of data.projects) {
    projectMap[p.id] = toFrontendProject(p, phasesByProject[p.id] ?? []);
  }

  const cpmTasks: CPMTask[] = data.tasks.map((t) => ({
    id: t.id,
    duration: t.effortEstimate ?? 8,
    dependencies: t.dependencies,
    dependents: t.dependents,
    status: t.status,
  }));
  const cpmResult = computeCPM(cpmTasks);

  const milestoneList: Milestone[] = (data.milestones ?? []).map((m) => ({
    id: m.id,
    projectId: m.projectId,
    title: m.title,
    date: String(m.date),
    isHardDeadline: m.isHardDeadline,
    description: m.description ?? null,
    canvasX: m.canvasX ?? null,
    canvasY: m.canvasY ?? null,
    daysUntil: m.daysUntil,
  }));

  const clusterPositions = new Map<string, { x: number; y: number }>();

  const projectNodes: Node<ProjectClusterNodeData>[] = data.projects.map(
    (p, i) => {
      const pos = projectGridPosition(i, p.canvasX, p.canvasY);
      clusterPositions.set(p.id, pos);

      const partners =
        data.partnerOrgsByProject?.[p.id]?.map((o) => o.orgName) ?? [];
      const budgetSummary = data.budgetByProject?.[p.id]?.summary ?? null;
      const health = data.projectHealth?.[p.id] ?? {
        score: 100,
        grade: "green" as const,
        blockedCriticalTasks: 0,
        overdueTaskCount: 0,
        budgetBurnPercent: null,
        daysToNextMilestone: null,
      };

      return {
        id: `project-${p.id}`,
        type: "projectCluster",
        position: pos,
        data: {
          project: projectMap[p.id],
          isExpanded: false,
          onToggleExpand: () => {},
          projectType: (p.projectType ?? "event") as ProjectType,
          isCollaborative: p.isCollaborative ?? false,
          health,
          partnerOrgs: partners,
          budgetSummary,
          upcomingMilestone: pickUpcomingMilestone(p.id, milestoneList),
        },
        hidden: false,
      };
    },
  );

  const milestonesByProject = new Map<string, Milestone[]>();
  for (const m of milestoneList) {
    const list = milestonesByProject.get(m.projectId) ?? [];
    list.push(m);
    milestonesByProject.set(m.projectId, list);
  }
  for (const [pid, list] of milestonesByProject) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    milestonesByProject.set(pid, list);
  }

  const milestoneNodes: Node<MilestoneNodeData>[] = milestoneList.map((m) => {
    const project = data.projects.find((p) => p.id === m.projectId);
    const cluster = clusterPositions.get(m.projectId) ?? { x: 200, y: 200 };
    const milestonesForProject = milestonesByProject.get(m.projectId) ?? [];
    const milestoneIndex = milestonesForProject.findIndex(
      (item) => item.id === m.id,
    );

    const hasApiPosition = m.canvasX != null && m.canvasY != null;
    const x = hasApiPosition
      ? m.canvasX!
      : cluster.x + 520;
    const y = hasApiPosition
      ? m.canvasY!
      : cluster.y + 60 + milestoneIndex * 90;

    return {
      id: `milestone-${m.id}`,
      type: "milestoneNode",
      position: { x, y },
      data: {
        milestoneId: m.id,
        title: m.title,
        date: m.date,
        isHardDeadline: m.isHardDeadline,
        daysUntil: m.daysUntil,
        projectColor: project?.color ?? "sky",
      },
      hidden: false,
    };
  });

  const taskPositionById = new Map<string, { x: number; y: number }>();
  for (const p of data.projects) {
    const cluster = clusterPositions.get(p.id) ?? { x: 200, y: 200 };
    const projectLayouts = layoutTasksForProject(
      p.id,
      cluster.x,
      cluster.y,
      data.phases,
      data.tasks,
    );
    for (const [taskId, pos] of projectLayouts) {
      taskPositionById.set(taskId, pos);
    }
  }

  let taskNodes: Node<TaskCardNodeData>[] = data.tasks.map((apiTask) => {
    const project = projectMap[apiTask.projectId];
    const assignees = apiTask.assigneeIds
      .map((id) => userMap[id])
      .filter(Boolean);
    const cpmNode = cpmResult.nodes[apiTask.id];
    const pos = taskPositionById.get(apiTask.id) ?? {
      x: apiTask.canvasX,
      y: apiTask.canvasY,
    };

    const task: Task = {
      id: apiTask.id,
      phaseId: apiTask.phaseId,
      projectId: apiTask.projectId,
      title: apiTask.title,
      description: apiTask.description ?? undefined,
      status: apiTask.status as TaskStatus,
      priority: apiTask.priority as TaskPriority,
      assigneeIds: apiTask.assigneeIds,
      effortEstimate: apiTask.effortEstimate ?? undefined,
      dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : undefined,
      canvasX: pos.x,
      canvasY: pos.y,
      isCriticalPath: cpmNode?.isCriticalPath ?? false,
      slackTime: cpmNode ? Math.round(cpmNode.float / 8) : undefined,
      earlyStart: cpmNode?.earlyStart,
      earlyFinish: cpmNode?.earlyFinish,
      lateStart: cpmNode?.lateStart,
      lateFinish: cpmNode?.lateFinish,
      dependencies: apiTask.dependencies,
      dependents: apiTask.dependents,
    };

    return {
      id: `task-${apiTask.id}`,
      type: "taskCard",
      position: pos,
      data: {
        task,
        assignees,
        projectColor: project?.color ?? "sky",
        isCriticalPath: task.isCriticalPath,
        slackTime: task.slackTime,
        isExpanded: false,
      },
    };
  });

  taskNodes = deCollide(taskNodes, 60) as Node<TaskCardNodeData>[];

  const personNodes: Node<PersonAvatarNodeData>[] = data.users.map((u, i) => ({
    id: `person-${u.id}`,
    type: "personAvatar",
    position: {
      x: PROJECT_ORIGIN_X + i * 120,
      y: PERSON_ROW_Y,
    },
    data: {
      user: userMap[u.id],
      isVisible: false,
      projectIds: Array.from(userProjectIds[u.id] ?? []),
    },
    hidden: true,
    zIndex: 1000,
  }));

  const edges: Edge[] = [];
  for (const apiTask of data.tasks) {
    for (const depId of apiTask.dependencies) {
      const isBothCritical =
        Boolean(cpmResult.nodes[apiTask.id]?.isCriticalPath) &&
        Boolean(cpmResult.nodes[depId]?.isCriticalPath);
      const strokeColor = isBothCritical
        ? "rgba(232, 175, 52, 0.7)"
        : "rgba(137, 146, 148, 0.35)";

      edges.push({
        id: `dep-${depId}-${apiTask.id}`,
        source: `task-${depId}`,
        target: `task-${apiTask.id}`,
        type: "dependency",
        style: {
          stroke: strokeColor,
          strokeWidth: isBothCritical ? 2 : 1.5,
          strokeDasharray: apiTask.status === "blocked" ? "6 3" : undefined,
          opacity: 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: strokeColor,
        },
        animated: false,
      });
    }
  }

  for (const link of data.crossProjectLinks ?? []) {
    const colorMap: Record<string, string> = {
      launches_at: "#a78bfa",
      talent_pipeline: "#34d399",
      venue_shared: "#60a5fa",
      funds_from: "#fbbf24",
      collaboration: "#f472b6",
    };
    const color = colorMap[link.type] ?? colorMap.collaboration;

    edges.push({
      id: `cross-${link.id}`,
      source: `project-${link.sourceProjectId}`,
      target: `project-${link.targetProjectId}`,
      type: "crossProject",
      hidden: false,
      data: { linkType: link.type, note: link.note },
      style: {
        stroke: color,
        strokeWidth: 1.5,
        strokeDasharray: "6 4",
        opacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 10,
        height: 10,
        color,
      },
      animated: true,
    });
  }

  return {
    nodes: [...projectNodes, ...milestoneNodes, ...taskNodes, ...personNodes],
    edges,
  };
}
