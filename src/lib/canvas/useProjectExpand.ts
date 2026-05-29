import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import type { OrgGraphResponse } from "@/lib/api/types";
import { phasePosition, personArcPosition } from "./layout";
import type {
  PhaseClusterNodeData,
  PersonAvatarNodeData,
  ProjectAccentColor,
  Phase,
} from "@/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

function getPhasePositions(
  projectNode: Node,
  phases: Phase[],
): Array<{ x: number; y: number }> {
  return phases.map((_, i) => phasePosition(projectNode.position, i));
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
        const stillExpanded = useCanvasStore.getState().expandedProjects;

        setNodes((allNodes) =>
          allNodes
            .filter((n) => !n.id.startsWith(`phase-${projectId}-`))
            .map((n) => {
              if (n.id === `project-${projectId}`) {
                return { ...n, data: { ...n.data, isExpanded: false } };
              }
              if (n.type !== "personAvatar") return n;

              const userId = n.id.replace("person-", "");
              const stillNeeded = graph.tasks.some(
                (t) =>
                  t.assigneeIds.includes(userId) &&
                  stillExpanded.has(t.projectId),
              );

              if (stillNeeded) return n;

              return {
                ...n,
                hidden: true,
                data: {
                  ...(n.data as PersonAvatarNodeData),
                  isVisible: false,
                },
              };
            }),
        );

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

          const positions = getPhasePositions(projectNode, phases);

          const phaseNodes: Node<PhaseClusterNodeData>[] = phases.map(
            (phase, i) => ({
              id: `phase-${projectId}-${phase.id}`,
              type: "phaseCluster",
              position: positions[i],
              data: { phase, projectColor },
              hidden: false,
            }),
          );

          const projectTaskUserIds = new Set(
            graph.tasks
              .filter((t) => t.projectId === projectId)
              .flatMap((t) => t.assigneeIds),
          );

          const memberPersonNodeIds = allNodes
            .filter(
              (n) =>
                n.type === "personAvatar" &&
                projectTaskUserIds.has(n.id.replace("person-", "")),
            )
            .map((n) => n.id);

          const totalMembers = memberPersonNodeIds.length;

          const withPhases = [
            ...allNodes.map((n) => {
              if (n.id === `project-${projectId}`) {
                return { ...n, data: { ...n.data, isExpanded: true } };
              }
              if (n.type !== "personAvatar") return n;

              const userId = n.id.replace("person-", "");
              if (!projectTaskUserIds.has(userId)) return n;

              const memberIndex = memberPersonNodeIds.indexOf(n.id);
              const arcPos = personArcPosition(
                projectNode.position,
                memberIndex,
                totalMembers,
              );

              return {
                ...n,
                position: arcPos,
                hidden: false,
                data: { ...n.data, isVisible: true },
              };
            }),
            ...phaseNodes,
          ];

          return withPhases;
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
