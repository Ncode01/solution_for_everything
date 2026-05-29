import { MarkerType, type Edge, type Node } from "@xyflow/react";
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_USERS,
  USER_MAP,
} from "@/lib/seed/mockData";
import { computeCPM } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import type {
  PersonAvatarNodeData,
  ProjectClusterNodeData,
  TaskCardNodeData,
} from "@/types";

const PROJECT_Y_POSITIONS: Record<string, number> = {
  p1: 150,
  p2: 520,
  p3: 820,
};

const cpmTasks: CPMTask[] = MOCK_TASKS.map((t) => ({
  id: t.id,
  duration: t.effortEstimate ?? 8,
  dependencies: t.dependencies,
  dependents: t.dependents,
  status: t.status,
}));

const cpmResult = computeCPM(cpmTasks);

function buildProjectNodes(
  onToggleExpand: (projectId: string) => void,
  expandedProjects: Set<string>,
): Node<ProjectClusterNodeData>[] {
  return MOCK_PROJECTS.map((project) => ({
    id: `project-${project.id}`,
    type: "projectCluster",
    position: { x: 60, y: PROJECT_Y_POSITIONS[project.id] ?? 100 },
    data: {
      project,
      isExpanded: expandedProjects.has(project.id),
      onToggleExpand,
    },
    hidden: false,
  }));
}

function buildTaskNodes(): Node<TaskCardNodeData>[] {
  return MOCK_TASKS.map((task) => {
    const project = MOCK_PROJECTS.find((p) => p.id === task.projectId)!;
    const assignees = task.assigneeIds
      .map((id) => USER_MAP[id])
      .filter(Boolean);
    const cpmNode = cpmResult.nodes[task.id];
    return {
      id: `task-${task.id}`,
      type: "taskCard",
      position: { x: task.canvasX, y: task.canvasY },
      data: {
        task: {
          ...task,
          isCriticalPath: cpmNode?.isCriticalPath ?? task.isCriticalPath,
          slackTime: cpmNode
            ? Math.round(cpmNode.float / 8)
            : task.slackTime,
        },
        assignees,
        projectColor: project.color,
        isCriticalPath: cpmNode?.isCriticalPath ?? task.isCriticalPath,
        slackTime: cpmNode ? Math.round(cpmNode.float / 8) : task.slackTime,
        isExpanded: false,
      },
    };
  });
}

function buildPersonAvatarNodes(): Node<PersonAvatarNodeData>[] {
  return MOCK_USERS.map((user) => {
    const userTasks = MOCK_TASKS.filter((t) =>
      t.assigneeIds.includes(user.id),
    );

    const avgX =
      userTasks.length > 0
        ? userTasks.reduce((sum, t) => sum + t.canvasX, 0) / userTasks.length
        : 200;
    const avgY =
      userTasks.length > 0
        ? userTasks.reduce((sum, t) => sum + t.canvasY, 0) / userTasks.length -
          120
        : 100;

    const projectIds = [
      ...new Set(
        userTasks.map((t) => t.projectId).filter((id): id is string => !!id),
      ),
    ];

    return {
      id: `person-${user.id}`,
      type: "personAvatar",
      position: { x: avgX, y: avgY },
      data: {
        user,
        isVisible: false,
        projectIds,
      },
      hidden: true,
      zIndex: 1000,
    };
  });
}

export function buildDependencyEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const task of MOCK_TASKS) {
    for (const depId of task.dependencies) {
      const upstream = MOCK_TASKS.find((t) => t.id === depId);
      const upstreamCpm = cpmResult.nodes[depId];
      const taskCpm = cpmResult.nodes[task.id];
      const isBothCritical =
        (taskCpm?.isCriticalPath ?? task.isCriticalPath) &&
        (upstreamCpm?.isCriticalPath ?? upstream?.isCriticalPath ?? false);
      const strokeColor = isBothCritical
        ? "rgba(232, 175, 52, 0.7)"
        : "rgba(137, 146, 148, 0.35)";

      edges.push({
        id: `dep-${depId}-${task.id}`,
        source: `task-${depId}`,
        target: `task-${task.id}`,
        type: "dependency",
        style: {
          stroke: strokeColor,
          strokeWidth: isBothCritical ? 2 : 1.5,
          strokeDasharray: task.status === "blocked" ? "6 3" : undefined,
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
  return edges;
}

/** @deprecated Use dependencyEdgeStyles.restoreDependencyEdgeStyles with API graph in production */
export function restoreDependencyEdgeStyles(edges: Edge[]): Edge[] {
  const defaults = buildDependencyEdges();
  const defaultById = new Map(defaults.map((e) => [e.id, e]));
  return edges.map((edge) => {
    if (!edge.id.startsWith("dep-")) return edge;
    const def = defaultById.get(edge.id);
    if (!def) return edge;
    return { ...edge, style: def.style, markerEnd: def.markerEnd };
  });
}

export function buildInitialGraph(
  onToggleExpand: (projectId: string) => void = () => {},
  expandedProjects: Set<string> = new Set(),
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      ...buildProjectNodes(onToggleExpand, expandedProjects),
      ...buildTaskNodes(),
      ...buildPersonAvatarNodes(),
    ],
    edges: buildDependencyEdges(),
  };
}

export { cpmResult, cpmTasks };
