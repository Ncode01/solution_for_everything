"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { MarkerType } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas.store";
import { computeCPM } from "@/lib/cpm";
import type { OrgGraphResponse } from "@/lib/api/types";
import type { TaskCardNodeData } from "@/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useCPMSync() {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const queryClient = useQueryClient();

  const recomputeCPM = useCallback(() => {
    const graph = queryClient.getQueryData<OrgGraphResponse>([
      "org-graph",
      ORG_ID,
    ]);
    if (!graph) return;

    const cpmTasks = graph.tasks.map((t) => ({
      id: t.id,
      duration: t.effortEstimate ?? 8,
      dependencies: t.dependencies,
      dependents: t.dependents,
      status: t.status,
    }));

    const cpmResult = computeCPM(cpmTasks);

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.type !== "taskCard") return node;
        const taskId = node.id.replace("task-", "");
        const cpmNode = cpmResult.nodes[taskId];
        if (!cpmNode) return node;
        const data = node.data as TaskCardNodeData;
        return {
          ...node,
          data: {
            ...data,
            isCriticalPath: cpmNode.isCriticalPath,
            slackTime: Math.round(cpmNode.float / 8),
            task: {
              ...data.task,
              isCriticalPath: cpmNode.isCriticalPath,
              slackTime: Math.round(cpmNode.float / 8),
              earlyStart: cpmNode.earlyStart,
              earlyFinish: cpmNode.earlyFinish,
              lateStart: cpmNode.lateStart,
              lateFinish: cpmNode.lateFinish,
            },
          },
        };
      }),
    );

    setEdges((edges) =>
      edges.map((edge) => {
        if (!edge.id.startsWith("dep-")) return edge;
        const sourceId = edge.source.replace("task-", "");
        const targetId = edge.target.replace("task-", "");
        const isBothCritical =
          cpmResult.nodes[sourceId]?.isCriticalPath &&
          cpmResult.nodes[targetId]?.isCriticalPath;
        const stroke = isBothCritical
          ? "rgba(232,175,52,0.7)"
          : "rgba(137,146,148,0.35)";
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke,
            strokeWidth: isBothCritical ? 2 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: stroke,
          },
        };
      }),
    );
  }, [queryClient, setNodes, setEdges]);

  return { recomputeCPM };
}
