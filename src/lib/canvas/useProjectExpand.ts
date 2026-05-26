import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { MOCK_PROJECTS } from "@/lib/seed/mockData";
import type { PhaseClusterNodeData, ProjectAccentColor } from "@/types";

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
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const toggleProjectExpanded = useCanvasStore((s) => s.toggleProjectExpanded);
  const expandedProjects = useCanvasStore((s) => s.expandedProjects);

  const handleToggleExpand = useCallback(
    (projectId: string) => {
      const project = MOCK_PROJECTS.find((p) => p.id === projectId);
      if (!project) return;

      const isCurrentlyExpanded = expandedProjects.has(projectId);
      toggleProjectExpanded(projectId);

      if (isCurrentlyExpanded) {
        setNodes((nodes) =>
          nodes
            .filter((n) => !n.id.startsWith(`phase-${projectId}-`))
            .map((n) => {
              if (n.id === `project-${projectId}`) {
                return {
                  ...n,
                  data: { ...n.data, isExpanded: false },
                };
              }
              return n;
            }),
        );
        setEdges((edges) =>
          edges.filter((e) => !e.id.startsWith(`project-phase-${projectId}`)),
        );
      } else {
        setNodes((allNodes) => {
          const projectNode = allNodes.find((n) => n.id === `project-${projectId}`);
          if (!projectNode) return allNodes;

          const positions = getPhasePositions(projectNode, project.phases.length);

          const phaseNodes: Node<PhaseClusterNodeData>[] = project.phases.map(
            (phase, i) => ({
              id: `phase-${projectId}-${phase.id}`,
              type: "phaseCluster",
              position: positions[i],
              data: {
                phase,
                projectColor: project.color as ProjectAccentColor,
              },
              hidden: false,
            }),
          );

          const updatedNodes = allNodes.map((n) => {
            if (n.id === `project-${projectId}`) {
              return { ...n, data: { ...n.data, isExpanded: true } };
            }
            return n;
          });

          return [...updatedNodes, ...phaseNodes];
        });

        setEdges((edges) => {
          const phaseEdges = project.phases.map((phase) => ({
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
    [setNodes, setEdges, toggleProjectExpanded, expandedProjects],
  );

  return { handleToggleExpand };
}
