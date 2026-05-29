import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas.store";
import { restoreDependencyEdgeStyles } from "@/lib/canvas/dependencyEdgeStyles";
import { getWorkloadStatsFromNodes } from "@/lib/canvas/workloadStats";
import type { OrgGraphResponse } from "@/lib/api/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useWorkloadLayer() {
  const queryClient = useQueryClient();
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);

  const activateWorkloadLayer = useCallback(() => {
    const nodes = useCanvasStore.getState().nodes;
    const { overloadedTaskIds } = getWorkloadStatsFromNodes(nodes);

    setActiveLayer("workload");

    setNodes((current) =>
      current.map((node) => {
        if (node.id.startsWith("person-")) {
          return { ...node, hidden: false };
        }
        if (node.id.startsWith("task-")) {
          const taskId = node.id.replace("task-", "");
          const isOverloaded = overloadedTaskIds.has(taskId);
          return {
            ...node,
            style: {
              opacity: 0.3,
              filter: isOverloaded ? "brightness(0.9)" : undefined,
            },
          };
        }
        if (
          node.id.startsWith("project-") ||
          node.id.startsWith("phase-")
        ) {
          return { ...node, hidden: true };
        }
        return node;
      }),
    );

    setEdges((edges) =>
      edges.map((edge) => {
        if (!edge.id.startsWith("dep-")) return edge;
        const sourceTaskId = edge.source.replace("task-", "");
        const targetTaskId = edge.target.replace("task-", "");
        const isOverloadedEdge =
          overloadedTaskIds.has(sourceTaskId) ||
          overloadedTaskIds.has(targetTaskId);
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isOverloadedEdge
              ? "rgba(221, 105, 116, 0.6)"
              : "rgba(137, 146, 148, 0.15)",
            strokeWidth: isOverloadedEdge ? 2 : 1,
            opacity: isOverloadedEdge ? 1 : 0.2,
          },
        };
      }),
    );
  }, [setActiveLayer, setNodes, setEdges]);

  const deactivateWorkloadLayer = useCallback(() => {
    setActiveLayer("default");

    const graph = queryClient.getQueryData<OrgGraphResponse>([
      "org-graph",
      ORG_ID,
    ]);

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id.startsWith("person-")) {
          return { ...node, hidden: true, style: undefined };
        }
        return { ...node, style: undefined };
      }),
    );

    setEdges((edges) => restoreDependencyEdgeStyles(edges, graph));
  }, [setActiveLayer, setNodes, setEdges, queryClient]);

  const toggleWorkloadLayer = useCallback(() => {
    if (activeLayer === "workload") {
      deactivateWorkloadLayer();
    } else {
      activateWorkloadLayer();
    }
  }, [activeLayer, activateWorkloadLayer, deactivateWorkloadLayer]);

  return {
    activeLayer,
    toggleWorkloadLayer,
    isWorkloadActive: activeLayer === "workload",
  };
}
