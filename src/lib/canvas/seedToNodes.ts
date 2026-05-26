import { MarkerType, type Edge, type Node } from "@xyflow/react";
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_USERS,
  USER_MAP,
} from "@/lib/seed/mockData";
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

const PERSON_X_POSITIONS = [900, 980, 1060, 1140];

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
    return {
      id: `task-${task.id}`,
      type: "taskCard",
      position: { x: task.canvasX, y: task.canvasY },
      data: {
        task,
        assignees,
        projectColor: project.color,
        isCriticalPath: task.isCriticalPath,
        slackTime: task.slackTime,
        isExpanded: false,
      },
    };
  });
}

function buildPersonNodes(): Node<PersonAvatarNodeData>[] {
  return MOCK_USERS.map((user, i) => ({
    id: `person-${user.id}`,
    type: "personAvatar",
    position: { x: PERSON_X_POSITIONS[i] ?? 900, y: 400 },
    data: {
      user,
      isVisible: false,
    },
    hidden: true,
  }));
}

function buildDependencyEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const task of MOCK_TASKS) {
    for (const depId of task.dependencies) {
      const upstream = MOCK_TASKS.find((t) => t.id === depId);
      const isBothCritical =
        task.isCriticalPath && (upstream?.isCriticalPath ?? false);
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

export function buildInitialGraph(
  onToggleExpand: (projectId: string) => void,
  expandedProjects: Set<string> = new Set(),
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      ...buildProjectNodes(onToggleExpand, expandedProjects),
      ...buildTaskNodes(),
      ...buildPersonNodes(),
    ],
    edges: buildDependencyEdges(),
  };
}
