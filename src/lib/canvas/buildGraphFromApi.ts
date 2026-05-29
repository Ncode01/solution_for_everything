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

export function buildGraphFromApi(data: OrgGraphResponse): {
  nodes: Node[];
  edges: Edge[];
} {
  const userTaskCount: Record<string, number> = {};
  for (const t of data.tasks) {
    for (const uid of t.assigneeIds) {
      userTaskCount[uid] = (userTaskCount[uid] ?? 0) + 1;
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

  const taskNodes: Node<TaskCardNodeData>[] = data.tasks.map((apiTask) => {
    const project = projectMap[apiTask.projectId];
    const assignees = apiTask.assigneeIds
      .map((id) => userMap[id])
      .filter(Boolean);
    const cpmNode = cpmResult.nodes[apiTask.id];

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
      canvasX: apiTask.canvasX,
      canvasY: apiTask.canvasY,
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
      position: { x: apiTask.canvasX, y: apiTask.canvasY },
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

  const projectNodes: Node<ProjectClusterNodeData>[] = data.projects.map(
    (p, i) => {
      const px = p.canvasX ?? 60 + (i % 3) * 600;
      const py = p.canvasY ?? 150 + Math.floor(i / 3) * 600;
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
        position: { x: px, y: py },
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

  const milestoneNodes: Node<MilestoneNodeData>[] = milestoneList.map((m) => {
    const project = data.projects.find((p) => p.id === m.projectId);
    const cluster = projectNodes.find((n) => n.id === `project-${m.projectId}`);
    const baseX = cluster?.position.x ?? 200;
    const baseY = cluster?.position.y ?? 200;

    return {
      id: `milestone-${m.id}`,
      type: "milestoneNode",
      position: {
        x: m.canvasX ?? baseX + 400,
        y: m.canvasY ?? baseY - 80,
      },
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

  const personNodes: Node<PersonAvatarNodeData>[] = data.users.map((u) => {
    const userTasks = data.tasks.filter((t) => t.assigneeIds.includes(u.id));
    const avgX =
      userTasks.length > 0
        ? userTasks.reduce((s, t) => s + t.canvasX, 0) / userTasks.length
        : 200;
    const avgY =
      userTasks.length > 0
        ? userTasks.reduce((s, t) => s + t.canvasY, 0) / userTasks.length - 120
        : 100;

    return {
      id: `person-${u.id}`,
      type: "personAvatar",
      position: { x: avgX, y: avgY },
      data: { user: userMap[u.id], isVisible: false },
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
