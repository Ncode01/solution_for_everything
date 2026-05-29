import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import type { OrgGraphResponse } from "@/lib/api/types";
import type {
  PhaseClusterNodeData,
  PersonAvatarNodeData,
  ProjectAccentColor,
  Phase,
} from "@/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

function getPhasePositions(
  projectNode: Node,
  phaseCount: number,
): Array<{ x: number; y: number }> {
  const BASE_X = projectNode.position.x + 280;
  const BASE_Y = projectNode.position.y - ((phaseCount - 1) * 80) / 2;
  return Array.from({ length: phaseCount }, (_, i) => ({
    x: BASE_X,
    y: BASE_Y + i * 90,
  }));
}

function applyPersonArcLayout(
  nodes: Node[],
  projectId: string,
): Node[] {
  const projectNode = nodes.find((nd) => nd.id === `project-${projectId}`);
  const clusterX = projectNode?.position.x ?? 200;
  const clusterY = projectNode?.position.y ?? 200;

  const members = nodes.filter(
    (nd) =>
      nd.type === "personAvatar" &&
      (nd.data as PersonAvatarNodeData).projectIds.includes(projectId),
  );
  const totalMembers = members.length;
  const arcSpacing = 80;
  const arcStartX = clusterX - (totalMembers * arcSpacing) / 2;

  return nodes.map((n) => {
    if (n.type !== "personAvatar") return n;
    const personData = n.data as PersonAvatarNodeData;
    if (!personData.projectIds.includes(projectId)) return n;

    const memberIndex = members.findIndex((nd) => nd.id === n.id);
    const arcX = arcStartX + memberIndex * arcSpacing;
    const arcY = clusterY - 160;

    return {
      ...n,
      position: { x: arcX, y: arcY },
      hidden: false,
      data: { ...personData, isVisible: true },
    };
  });
}

function hideProjectPersons(
  nodes: Node[],
  projectId: string,
  expandedAfterCollapse: Set<string>,
): Node[] {
  return nodes.map((n) => {
    if (n.type !== "personAvatar") return n;
    const personData = n.data as PersonAvatarNodeData;
    if (!personData.projectIds.includes(projectId)) return n;

    const stillVisible = personData.projectIds.some(
      (pid) => pid !== projectId && expandedAfterCollapse.has(pid),
    );
    if (stillVisible) return n;

    return {
      ...n,
      hidden: true,
      data: { ...personData, isVisible: false },
    };
  });
}

export function useProjectExpand() {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const toggleProjectExpanded = useCanvasStore((s) => s.toggleProjectExpanded);

  const handleToggleExpand = useCallback(
    (projectId: string) => {
      const expandedProjects = useCanvasStore.getState().expandedProjects;
      const graph = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      if (!graph) return;

      const apiProject = graph.projects.find((p) => p.id === projectId);
      if (!apiProject) return;

      const apiPhases = graph.phases.filter((ph) => ph.projectId === projectId);
      if (apiPhases.length === 0) return;

      const phases: Phase[] = apiPhases
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => {
          const projectTasks = graph.tasks.filter((t) => t.phaseId === p.id);
          const doneCount = projectTasks.filter(
            (t) => t.status === "done",
          ).length;
          return {
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
        });

      const projectColor = (apiProject.color as ProjectAccentColor) ?? "sky";
      const isCurrentlyExpanded = expandedProjects.has(projectId);
      toggleProjectExpanded(projectId);

      if (isCurrentlyExpanded) {
        const expandedAfterCollapse =
          useCanvasStore.getState().expandedProjects;

        setNodes((nodes) => {
          const withoutPhases = nodes
            .filter((n) => !n.id.startsWith(`phase-${projectId}-`))
            .map((n) => {
              if (n.id === `project-${projectId}`) {
                return { ...n, data: { ...n.data, isExpanded: false } };
              }
              return n;
            });
          return hideProjectPersons(
            withoutPhases,
            projectId,
            expandedAfterCollapse,
          );
        });

        setEdges((edges) =>
          edges.filter(
            (e) =>
              !e.id.startsWith(`project-phase-${projectId}`) &&
              !e.id.startsWith(`person-assign-${projectId}-`),
          ),
        );
      } else {
        setNodes((allNodes) => {
          const projectNode = allNodes.find(
            (n) => n.id === `project-${projectId}`,
          );
          if (!projectNode) return allNodes;

          const positions = getPhasePositions(projectNode, phases.length);

          const phaseNodes: Node<PhaseClusterNodeData>[] = phases.map(
            (phase, i) => ({
              id: `phase-${projectId}-${phase.id}`,
              type: "phaseCluster",
              position: positions[i],
              data: { phase, projectColor },
              hidden: false,
            }),
          );

          const withPhases = [
            ...allNodes.map((n) =>
              n.id === `project-${projectId}`
                ? { ...n, data: { ...n.data, isExpanded: true } }
                : n,
            ),
            ...phaseNodes,
          ];

          return applyPersonArcLayout(withPhases, projectId);
        });

        setEdges((edges) => {
          const withoutStale = edges.filter(
            (e) => !e.id.startsWith(`person-assign-${projectId}-`),
          );

          const assigneeIds = new Set<string>();
          for (const task of graph.tasks) {
            if (task.projectId !== projectId) continue;
            for (const uid of task.assigneeIds) {
              assigneeIds.add(uid);
            }
          }

          const assignmentEdges = [...assigneeIds].map((userId) => ({
            id: `person-assign-${projectId}-${userId}`,
            source: `person-${userId}`,
            target: `project-${projectId}`,
            style: {
              stroke: "rgba(137, 146, 148, 0.15)",
              strokeWidth: 1,
              strokeDasharray: "3 4",
            },
            animated: false,
          }));

          const phaseEdges = phases.map((phase) => ({
            id: `project-phase-${projectId}-${phase.id}`,
            source: `project-${projectId}`,
            target: `phase-${projectId}-${phase.id}`,
            style: {
              stroke: "rgba(137, 146, 148, 0.2)",
              strokeWidth: 1,
              strokeDasharray: "4 3",
            },
            animated: false,
          }));

          return [...withoutStale, ...phaseEdges, ...assignmentEdges];
        });
      }
    },
    [queryClient, setNodes, setEdges, toggleProjectExpanded],
  );

  return { handleToggleExpand };
}
