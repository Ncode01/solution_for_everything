import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import type { OrgGraphResponse } from "@/lib/api/types";
import type { PhaseClusterNodeData, ProjectAccentColor, Phase } from "@/types";

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
        setNodes((nodes) =>
          nodes
            .filter((n) => !n.id.startsWith(`phase-${projectId}-`))
            .map((n) => {
              if (n.id === `project-${projectId}`) {
                return { ...n, data: { ...n.data, isExpanded: false } };
              }
              return n;
            }),
        );
        setEdges((edges) =>
          edges.filter((e) => !e.id.startsWith(`project-phase-${projectId}`)),
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

          return [
            ...allNodes.map((n) =>
              n.id === `project-${projectId}`
                ? { ...n, data: { ...n.data, isExpanded: true } }
                : n,
            ),
            ...phaseNodes,
          ];
        });

        setEdges((edges) => {
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
          return [...edges, ...phaseEdges];
        });
      }
    },
    [queryClient, setNodes, setEdges, toggleProjectExpanded],
  );

  return { handleToggleExpand };
}
