import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { ApiTask, OrgGraphResponse } from "@/lib/api/types";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import { loadLevelFromTaskCount } from "@/lib/userLoadLevel";
import {
  columnHeight,
  ENVELOPE_BODY_TOP_OFFSET,
  ENVELOPE_HEADER_HEIGHT,
  ENVELOPE_PADDING_X,
  milestonePosition,
  personRowPosition,
  projectGridPosition,
  richColumnX,
  richEnvelopeSize,
  RICH_LAYOUT,
  stackedColumnPositions,
} from "./layout";
import {
  NODE_TYPE_HEIGHT,
  resolveTaskNodeType,
} from "./resolveTaskNodeType";
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
  ProjectEnvelopeNodeData,
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

function buildRichNodeData(
  apiTask: ApiTask,
  task: Task,
  assignees: User[],
  projectColor: ProjectAccentColor,
  isCrit: boolean,
  slack: number,
  savedToDb: boolean,
  userMap: Record<string, User>,
): TaskCardNodeData & Record<string, unknown> {
  return {
    task,
    assignees,
    projectColor,
    isCriticalPath: isCrit,
    slackTime: slack,
    isExpanded: false,
    _savedToDb: savedToDb,
    checklist: apiTask.checklist ?? null,
    requiresApproval: apiTask.requiresApproval ?? false,
    approverId: apiTask.approverId ?? null,
    approverUser: apiTask.approverId ? userMap[apiTask.approverId] : null,
    recurrence: apiTask.recurrence ?? null,
    recurrenceNext: apiTask.recurrenceNext ?? null,
    recurrenceLast: apiTask.recurrenceLast ?? null,
    blockedReason: apiTask.blockedReason ?? null,
    blockedByTaskId: apiTask.blockedByTaskId ?? null,
    externalLinks: apiTask.externalLinks ?? null,
    githubPrUrl: apiTask.githubPrUrl ?? null,
    githubPrStatus: apiTask.githubPrStatus ?? null,
    githubPrTitle: apiTask.githubPrTitle ?? null,
    riskLevel: apiTask.riskLevel ?? null,
    riskDescription: apiTask.riskDescription ?? null,
    note: apiTask.note ?? null,
    noteAuthorUser: apiTask.noteAuthorId
      ? userMap[apiTask.noteAuthorId]
      : null,
    isDecisionPoint: apiTask.isDecisionPoint ?? false,
    ganttStartDate: apiTask.ganttStartDate ?? null,
    ganttEndDate: apiTask.ganttEndDate ?? null,
    ganttProgress: apiTask.ganttProgress ?? 0,
    costEstimate: apiTask.costEstimate ?? null,
  };
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

  const projectRichHeights = new Map<string, number>();

  const tasksByPhase = new Map<string, ApiTask[]>();
  for (const proj of data.projects) {
    const projPhases = data.phases
      .filter((ph) => ph.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    for (const phase of projPhases) {
      const phaseTasks = data.tasks
        .filter((t) => t.phaseId === phase.id)
        .sort((a, b) => {
          const aCrit = cpmResult.nodes[a.id]?.isCriticalPath ? 0 : 1;
          const bCrit = cpmResult.nodes[b.id]?.isCriticalPath ? 0 : 1;
          if (aCrit !== bCrit) return aCrit - bCrit;
          return a.title.localeCompare(b.title);
        });
      tasksByPhase.set(phase.id, phaseTasks);
    }
  }

  const allTaskNodes: Node[] = [];
  const widgetNodes: Node[] = [];

  for (const proj of data.projects) {
    const projectPos = projectPositionMap.get(proj.id) ?? { x: 120, y: 200 };
    const projPhases = data.phases
      .filter((ph) => ph.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const columnHeights: number[] = [];

    projPhases.forEach((phase, phaseIdx) => {
      const colX = richColumnX(projectPos.x, phaseIdx);
      const phaseTasks = tasksByPhase.get(phase.id) ?? [];
      const heights = phaseTasks.map((t) => {
        const isCrit = cpmResult.nodes[t.id]?.isCriticalPath ?? false;
        const nodeType = resolveTaskNodeType(t, isCrit);
        let h = NODE_TYPE_HEIGHT[nodeType];
        if (t.requiresApproval && nodeType !== "approvalGate") {
          h += NODE_TYPE_HEIGHT.approvalGate + RICH_LAYOUT.VERTICAL_GAP;
        }
        return h;
      });

      const startYOffset =
        RICH_LAYOUT.START_Y_OFFSET +
        RICH_LAYOUT.PHASE_LABEL_H +
        RICH_LAYOUT.PHASE_LABEL_GAP;

      const yPositions = stackedColumnPositions(
        projectPos.y,
        heights,
        startYOffset,
        RICH_LAYOUT.VERTICAL_GAP,
      );

      columnHeights.push(columnHeight(heights, RICH_LAYOUT.VERTICAL_GAP));

      phaseTasks.forEach((apiTask, taskIdx) => {
        const isCrit = cpmResult.nodes[apiTask.id]?.isCriticalPath ?? false;
        const nodeType = resolveTaskNodeType(apiTask, isCrit);
        const slack = cpmResult.nodes[apiTask.id]
          ? Math.round(cpmResult.nodes[apiTask.id].float / 8)
          : 0;

        const pos =
          apiTask.canvasX !== 0 || apiTask.canvasY !== 0
            ? { x: apiTask.canvasX, y: apiTask.canvasY }
            : { x: colX, y: yPositions[taskIdx] };

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
          canvasX: pos.x,
          canvasY: pos.y,
          isCriticalPath: isCrit,
          slackTime: slack,
          earlyStart: cpmNode?.earlyStart,
          earlyFinish: cpmNode?.earlyFinish,
          lateStart: cpmNode?.lateStart,
          lateFinish: cpmNode?.lateFinish,
          dependencies: apiTask.dependencies,
          dependents: apiTask.dependents,
        };

        const nodeData = buildRichNodeData(
          apiTask,
          task,
          assignees,
          project?.color ?? "sky",
          isCrit,
          slack,
          apiTask.canvasX !== 0 || apiTask.canvasY !== 0,
          userMap,
        );

        allTaskNodes.push({
          id: `task-${apiTask.id}`,
          type: nodeType,
          position: pos,
          data: nodeData,
          hidden: false,
        });

        if (
          apiTask.requiresApproval &&
          nodeType !== "approvalGate" &&
          nodeType !== "reviewTask"
        ) {
          const approvalY =
            pos.y + NODE_TYPE_HEIGHT[nodeType] + RICH_LAYOUT.VERTICAL_GAP;
          allTaskNodes.push({
            id: `approval-${apiTask.id}`,
            type: "approvalGate",
            position: { x: colX, y: approvalY },
            data: nodeData,
            hidden: false,
          });
        }
      });
    });

    const budget = data.budgetByProject?.[proj.id]?.summary ?? null;
    const health = data.projectHealth?.[proj.id] ?? null;
    const colD_X = richColumnX(projectPos.x, 3);
    const startY = projectPos.y + RICH_LAYOUT.START_Y_OFFSET;

    let colDHeight = 0;
    if (budget) {
      const allocated = budget.totalIncome;
      const spent = budget.totalExpenditure;
      const remaining = budget.surplus;
      const weeklyBurnRate = Math.round(spent / 18);
      const trendPercent = 14;

      widgetNodes.push({
        id: `budget-gauge-${proj.id}`,
        type: "budgetGauge",
        position: { x: colD_X, y: startY },
        data: {
          allocated,
          spent,
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      widgetNodes.push({
        id: `budget-summary-${proj.id}`,
        type: "budgetSummaryCard",
        position: { x: colD_X, y: startY + 160 + 18 },
        data: {
          allocated,
          spent,
          remaining,
          weeklyBurnRate,
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      const dailyValues = Array.from({ length: 14 }, (_, i) =>
        Math.round((spent / 14) * (0.9 + ((i * 7 + proj.id.charCodeAt(0)) % 20) / 100)),
      );
      widgetNodes.push({
        id: `burnrate-${proj.id}`,
        type: "burnRateSparkline",
        position: { x: colD_X, y: startY + 160 + 18 + 140 + 18 },
        data: {
          weeklyBurnRate,
          trendPercent,
          dailyValues,
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      colDHeight = 160 + 18 + 140 + 18 + 80 + 18;
    }

    const colE_X = richColumnX(projectPos.x, 4);
    const projectMembers = data.users.filter((u) =>
      data.tasks.some(
        (t) => t.projectId === proj.id && t.assigneeIds.includes(u.id),
      ),
    );

    widgetNodes.push({
      id: `team-cluster-${proj.id}`,
      type: "teamCluster",
      position: { x: colE_X, y: startY },
      data: {
        users: projectMembers.map((u) => userMap[u.id]),
        totalTaskCount: data.tasks.filter((t) => t.projectId === proj.id)
          .length,
        projectColor: proj.color,
      },
      hidden: false,
      draggable: false,
      selectable: false,
    });

    let workloadY = startY + 90 + 18;
    for (const member of projectMembers.slice(0, 3)) {
      widgetNodes.push({
        id: `workload-${proj.id}-${member.id}`,
        type: "workloadCard",
        position: { x: colE_X, y: workloadY },
        data: {
          user: userMap[member.id],
          projectColor: proj.color,
          weeklyHours: Array.from({ length: 5 }, (_, i) =>
            Math.round(2 + ((member.id.charCodeAt(0) + i * 3) % 8)),
          ),
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      workloadY += 160 + 18;
    }

    widgetNodes.push({
      id: `assignment-matrix-${proj.id}`,
      type: "assignmentMatrix",
      position: { x: colE_X, y: workloadY },
      data: {
        users: projectMembers.map((u) => userMap[u.id]),
        phases: [...(phasesByProject[proj.id] ?? [])].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        ),
        tasks: data.tasks.filter((t) => t.projectId === proj.id),
        projectColor: proj.color,
      },
      hidden: false,
      draggable: false,
      selectable: false,
    });

    const colEHeight = workloadY + 160 - startY;

    const colF_X = richColumnX(projectPos.x, 5);
    let ringY = startY;
    const projectPhases = phasesByProject[proj.id] ?? [];
    for (const phase of projectPhases.slice(0, 3)) {
      widgetNodes.push({
        id: `phase-ring-${phase.id}`,
        type: "phaseProgressRing",
        position: { x: colF_X, y: ringY },
        data: {
          phaseName: phase.name,
          doneCount: phase.doneCount,
          taskCount: phase.taskCount,
          completionPercent: phase.completionPercent,
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      ringY += 120 + 18;
    }

    if (health) {
      widgetNodes.push({
        id: `health-${proj.id}`,
        type: "healthScoreCard",
        position: { x: colF_X, y: ringY },
        data: {
          score: health.score,
          grade: health.grade,
          dimensions: {
            scope: Math.round(
              Math.min(100, 100 - health.overdueTaskCount * 5),
            ),
            time: Math.round(
              Math.min(
                100,
                health.daysToNextMilestone != null
                  ? Math.max(0, 100 - health.blockedCriticalTasks * 20)
                  : 80,
              ),
            ),
            cost: Math.round(
              Math.min(100, 100 - (health.budgetBurnPercent ?? 0)),
            ),
            quality: Math.round(
              Math.min(100, 100 - health.blockedCriticalTasks * 15),
            ),
          },
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      ringY += 180 + 18;
    }

    const projTasks = data.tasks.filter((t) => t.projectId === proj.id);
    widgetNodes.push({
      id: `status-matrix-${proj.id}`,
      type: "statusMatrix",
      position: { x: colF_X, y: ringY },
      data: {
        statusCounts: {
          done: projTasks.filter((t) => t.status === "done").length,
          in_progress: projTasks.filter((t) => t.status === "in_progress")
            .length,
          review: projTasks.filter((t) => t.status === "in_review").length,
          todo: projTasks.filter((t) => t.status === "not_started").length,
          blocked: projTasks.filter((t) => t.status === "blocked").length,
        },
        projectColor: proj.color,
      },
      hidden: false,
      draggable: false,
      selectable: false,
    });

    const colFHeight = ringY + 110 - startY;
    const colG_X = richColumnX(projectPos.x, 6);
    let colG_Y = startY;

    for (const t of projTasks.filter((t) => t.githubPrUrl)) {
      widgetNodes.push({
        id: `pr-${t.id}`,
        type: "prStatus",
        position: { x: colG_X, y: colG_Y },
        data: {
          prTitle: t.githubPrTitle ?? t.title,
          prUrl: t.githubPrUrl,
          prStatus: t.githubPrStatus ?? "open",
          taskTitle: t.title,
          projectColor: proj.color,
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      colG_Y += 100 + 18;
    }

    for (const t of projTasks.filter((t) => t.externalLinks?.length)) {
      for (const link of t.externalLinks ?? []) {
        widgetNodes.push({
          id: `extlink-${link.id}`,
          type: "externalLinkCard",
          position: { x: colG_X, y: colG_Y },
          data: { link, taskTitle: t.title, projectColor: proj.color },
          hidden: false,
          draggable: false,
          selectable: false,
        });
        colG_Y += 80 + 18;
      }
    }

    if (proj.name.includes("SparkIT")) {
      widgetNodes.push({
        id: `sticky-${proj.id}`,
        type: "stickyNote",
        position: { x: colG_X, y: colG_Y },
        data: {
          content:
            "Showcase layout: every node type has a justified slot in the rich column grid.",
          authorName: "FlowCanvas",
          timestamp: "May 2026",
          variant: "teal",
        },
        hidden: false,
        draggable: false,
        selectable: false,
      });
      colG_Y += 120 + 18;
    }

    widgetNodes.push({
      id: `warp-${proj.id}`,
      type: "warpGate",
      position: { x: colG_X, y: colG_Y },
      data: {
        warpTargetNodeId: `project-${proj.id}`,
        label: `↑ ${proj.name}`,
        projectColor: proj.color,
      },
      hidden: false,
      draggable: false,
      selectable: false,
    });

    const colGHeight = colG_Y + 100 - startY;
    const maxColHeight = Math.max(
      ...columnHeights,
      colDHeight,
      colEHeight,
      colFHeight,
      colGHeight,
      RICH_LAYOUT.START_Y_OFFSET,
    );
    projectRichHeights.set(proj.id, maxColHeight);
  }

  const envelopeNodes: Node<ProjectEnvelopeNodeData>[] = data.projects.map(
    (proj) => {
      const projectPos = projectPositionMap.get(proj.id) ?? { x: 0, y: 0 };
      const maxColHeight = projectRichHeights.get(proj.id) ?? 400;
      const { width: envelopeWidth, height: envelopeHeight } = richEnvelopeSize(
        7,
        maxColHeight,
      );

      const envelopeX = projectPos.x - ENVELOPE_PADDING_X;
      const envelopeY =
        projectPos.y - ENVELOPE_HEADER_HEIGHT - ENVELOPE_BODY_TOP_OFFSET;

      return {
        id: `envelope-${proj.id}`,
        type: "projectEnvelope",
        position: { x: envelopeX, y: envelopeY },
        zIndex: -1,
        selectable: false,
        draggable: true,
        focusable: false,
        data: {
          projectId: proj.id,
          projectName: proj.name,
          projectColor: proj.color,
          status: proj.status,
          completionPercent: proj.completionPercent,
          envelopeWidth,
          envelopeHeight,
          _savedToDb: false,
        } satisfies ProjectEnvelopeNodeData & { _savedToDb: boolean },
        hidden: false,
      };
    },
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

  const phaseHeaderNodes: Node<PhaseHeaderNodeData>[] = [];
  for (const proj of data.projects) {
    const projectPos = projectPositionMap.get(proj.id);
    if (!projectPos) continue;

    const projPhases = data.phases
      .filter((ph) => ph.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    projPhases.forEach((phase, phaseIdx) => {
      if (phaseIdx > 2) return;
      const x = richColumnX(projectPos.x, phaseIdx);
      const y =
        projectPos.y +
        RICH_LAYOUT.START_Y_OFFSET -
        RICH_LAYOUT.PHASE_LABEL_H -
        RICH_LAYOUT.PHASE_LABEL_GAP;

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
      ...envelopeNodes,
      ...projectNodes,
      ...milestoneNodes,
      ...allTaskNodes,
      ...widgetNodes,
      ...phaseHeaderNodes,
      ...personNodes,
    ],
    edges,
  };
}
