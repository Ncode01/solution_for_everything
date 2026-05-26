import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas.store";
import { MOCK_TASKS, MOCK_USERS } from "@/lib/seed/mockData";
import { restoreDependencyEdgeStyles } from "@/lib/canvas/seedToNodes";

function getOverloadedTaskIds(): Set<string> {
  const overloadedUserIds = new Set(
    MOCK_USERS.filter((u) => u.loadLevel === "overloaded").map((u) => u.id),
  );
  const ids = new Set<string>();
  for (const task of MOCK_TASKS) {
    if (task.assigneeIds.some((id) => overloadedUserIds.has(id))) {
      ids.add(task.id);
    }
  }
  return ids;
}

export function useWorkloadLayer() {
  const activeLayer = useCanvasStore((s) => s.activeLayer);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);

  const activateWorkloadLayer = useCallback(() => {
    setActiveLayer("workload");
    const overloadedTaskIds = getOverloadedTaskIds();

    setNodes((nodes) =>
      nodes.map((node) => {
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

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id.startsWith("person-")) {
          return { ...node, hidden: true, style: undefined };
        }
        return { ...node, style: undefined };
      }),
    );

    setEdges((edges) => restoreDependencyEdgeStyles(edges));
  }, [setActiveLayer, setNodes, setEdges]);

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
