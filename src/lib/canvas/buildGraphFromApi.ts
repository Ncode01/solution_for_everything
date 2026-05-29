import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { OrgGraphResponse } from "@/lib/api/types";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import { loadLevelFromTaskCount } from "@/lib/userLoadLevel";
import {
  LAYOUT,
  milestonePosition,
  personRowPosition,
  projectGridPosition,
  taskSwimlanePosition,
} from "./layout";
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

export type PhaseHeaderNodeData = {
  phaseName: string;
  projectColor: string;
  [key: string]: unknown;
};

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

function isSavedToDb(x?: number | null, y?: number | null): boolean {
  return (x != null && x !== 0) || (y != null && y !== 0);
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

  const projectNodes: Node<ProjectClusterNodeData>[] = data.projects.map(
    (p, i) => {
      const pos = projectGridPosition(i, p.canvasX, p.canvasY);

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
          _savedToDb: isSavedToDb(p.canvasX, p.canvasY),
        },
        hidden: false,
      };
    },
  );

  const projectPositionMap = new Map<string, { x: number; y: number }>(
    projectNodes.map((n) => [n.data.project.id, n.position]),
  );

  const milestonesByProject = new Map<string, Milestone[]>();
  for (const m of milestoneList) {
    if (!milestonesByProject.has(m.projectId)) {
      milestonesByProject.set(m.projectId, []);
    }
    milestonesByProject.get(m.projectId)!.push(m);
  }
  for (const arr of milestonesByProject.values()) {
    arr.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  const milestoneNodes: Node<MilestoneNodeData>[] = milestoneList.map((m) => {
    const project = data.projects.find((p) => p.id === m.projectId);
    const projectPos = projectPositionMap.get(m.projectId) ?? {
      x: 200,
      y: 200,
    };
    const milestoneArr = milestonesByProject.get(m.projectId) ?? [];
    const milestoneIndex = milestoneArr.findIndex((ms) => ms.id === m.id);
    const { x: mx, y: my } = milestonePosition(
      projectPos,
      milestoneIndex,
      m.canvasX,
      m.canvasY,
    );

    return {
      id: `milestone-${m.id}`,
      type: "milestoneNode",
      position: { x: mx, y: my },
      data: {
        milestoneId: m.id,
        title: m.title,
        date: m.date,
        isHardDeadline: m.isHardDeadline,
        daysUntil: m.daysUntil,
        projectColor: project?.color ?? "sky",
        _savedToDb: isSavedToDb(m.canvasX, m.canvasY),
      },
      hidden: false,
    };
  });

  const phaseColumnIndex = new Map<string, number>();
  for (const proj of data.projects) {
    const projPhases = data.phases
      .filter((ph) => ph.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    projPhases.forEach((ph, idx) => {
      phaseColumnIndex.set(ph.id, idx);
    });
  }

  const taskIndexInPhase = new Map<string, number>();
  const taskCountPerPhase = new Map<string, number>();

  const tasksSortedByPhase = [...data.tasks].sort((a, b) => {
    const colA = phaseColumnIndex.get(a.phaseId) ?? 0;
    const colB = phaseColumnIndex.get(b.phaseId) ?? 0;
    if (colA !== colB) return colA - colB;
    const aCrit = cpmResult.nodes[a.id]?.isCriticalPath ? 0 : 1;
    const bCrit = cpmResult.nodes[b.id]?.isCriticalPath ? 0 : 1;
    if (aCrit !== bCrit) return aCrit - bCrit;
    return a.title.localeCompare(b.title);
  });

  for (const t of tasksSortedByPhase) {
    const current = taskCountPerPhase.get(t.phaseId) ?? 0;
    taskIndexInPhase.set(t.id, current);
    taskCountPerPhase.set(t.phaseId, current + 1);
  }

  let taskNodes: Node<TaskCardNodeData>[] = data.tasks.map((apiTask) => {
    const project = projectMap[apiTask.projectId];
    const assignees = apiTask.assigneeIds
      .map((id) => userMap[id])
      .filter(Boolean);
    const cpmNode = cpmResult.nodes[apiTask.id];
    const projectPos = projectPositionMap.get(apiTask.projectId) ?? {
      x: 120,
      y: 200,
    };
    const phaseCol = phaseColumnIndex.get(apiTask.phaseId) ?? 0;
    const taskRow = taskIndexInPhase.get(apiTask.id) ?? 0;
    const isCrit = cpmNode?.isCriticalPath ?? false;
    const slack = cpmNode ? Math.round(cpmNode.float / 8) : 0;

    const taskPos = taskSwimlanePosition(
      projectPos,
      phaseCol,
      taskRow,
      isCrit,
      slack,
      apiTask.canvasX,
      apiTask.canvasY,
    );

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
      canvasX: taskPos.x,
      canvasY: taskPos.y,
      isCriticalPath: isCrit,
      slackTime: slack,
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
      position: taskPos,
      data: {
        task,
        assignees,
        projectColor: project?.color ?? "sky",
        isCriticalPath: task.isCriticalPath,
        slackTime: task.slackTime,
        isExpanded: false,
        _savedToDb: apiTask.canvasX !== 0 || apiTask.canvasY !== 0,
      },
      hidden: false,
    };
  });

  taskNodes = deCollide(taskNodes, 60) as Node<TaskCardNodeData>[];

  const phaseHeaderNodes: Node<PhaseHeaderNodeData>[] = [];
  for (const proj of data.projects) {
    const projectPos = projectPositionMap.get(proj.id);
    if (!projectPos) continue;

    const projPhases = data.phases
      .filter((ph) => ph.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    projPhases.forEach((phase, phaseIdx) => {
      const x =
        projectPos.x +
        phaseIdx * (LAYOUT.TASK.PHASE_COL_WIDTH + LAYOUT.TASK.PHASE_GAP);
      const y = projectPos.y + LAYOUT.TASK.BAND_OFFSET_Y - 50;

      phaseHeaderNodes.push({
        id: `phase-header-${phase.id}`,
        type: "phaseHeader",
        position: { x, y },
        data: {
          phaseName: phase.name,
          projectColor: proj.color,
        },
        draggable: false,
        selectable: false,
        hidden: false,
      });
    });
  }

  const personNodes: Node<PersonAvatarNodeData>[] = data.users.map((u, i) => {
    const { x: px, y: py } = personRowPosition(i);
    return {
      id: `person-${u.id}`,
      type: "personAvatar",
      position: { x: px, y: py },
      data: {
        user: userMap[u.id],
        isVisible: false,
        projectIds: Array.from(userProjectIds[u.id] ?? []),
      },
      hidden: true,
      zIndex: 1000,
    };
  });

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
    nodes: [
      ...projectNodes,
      ...milestoneNodes,
      ...taskNodes,
      ...phaseHeaderNodes,
      ...personNodes,
    ],
    edges,
  };
}
