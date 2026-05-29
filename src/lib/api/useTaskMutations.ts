"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { MarkerType, type Edge } from "@xyflow/react";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { logOnce, logDevOnce } from "@/lib/diagnostics";
import type {
  ApiTask,
  CreateTaskBody,
  OrgGraphResponse,
  UpdateTaskBody,
} from "./types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

function isPositionOnlyBody(body: UpdateTaskBody): boolean {
  const keys = Object.keys(body);
  return (
    keys.length > 0 && keys.every((k) => k === "canvasX" || k === "canvasY")
  );
}

/** Apply optimistic canvas coordinates to the org-graph cache (immediate, pre-debounce). */
export function applyOptimisticTaskPosition(
  queryClient: QueryClient,
  taskId: string,
  canvasX: number,
  canvasY: number,
): void {
  queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, canvasX, canvasY } : t,
      ),
    };
  });
  logDevOnce(
    "drag-optimistic",
    `[OrgGraph] optimistic drag position applied for task ${taskId}`,
  );
}

function dependencyEdge(upstreamTaskId: string, taskId: string): Edge {
  return {
    id: `dep-${upstreamTaskId}-${taskId}`,
    source: `task-${upstreamTaskId}`,
    target: `task-${taskId}`,
    type: "dependency",
    style: {
      stroke: "rgba(137,146,148,0.35)",
      strokeWidth: 1.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: "rgba(137,146,148,0.35)",
    },
    animated: false,
  };
}

function toApiTask(
  row: ApiTask & { assigneeIds?: string[] },
  existing?: ApiTask,
): ApiTask {
  return {
    id: row.id,
    phaseId: row.phaseId,
    projectId: row.projectId,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    priority: row.priority,
    effortEstimate: row.effortEstimate ?? null,
    dueDate: row.dueDate ?? null,
    canvasX: row.canvasX ?? existing?.canvasX ?? 400,
    canvasY: row.canvasY ?? existing?.canvasY ?? 300,
    assigneeIds: row.assigneeIds ?? existing?.assigneeIds ?? [],
    dependencies: row.dependencies ?? existing?.dependencies ?? [],
    dependents: row.dependents ?? existing?.dependents ?? [],
  };
}

type CreateCtx = { previous?: OrgGraphResponse; tempId?: string };
type GraphCtx = { previous?: OrgGraphResponse };
type CanvasCtx = GraphCtx & {
  previousNodes?: ReturnType<typeof useCanvasStore.getState>["nodes"];
  previousEdges?: ReturnType<typeof useCanvasStore.getState>["edges"];
  positionOnly?: boolean;
};

export function useCreateTaskMutation(
  options?: UseMutationOptions<ApiTask, Error, CreateTaskBody, CreateCtx>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => apiClient.createTask(body),
    ...options,
    onMutate: async (body, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      const tempId = `temp-task-${Date.now()}`;
      const optimistic: ApiTask = {
        id: tempId,
        phaseId: body.phaseId,
        projectId: body.projectId,
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "not_started",
        priority: body.priority ?? "medium",
        effortEstimate: body.effortEstimate ?? null,
        dueDate: body.dueDate ?? null,
        canvasX: body.canvasX ?? 400,
        canvasY: body.canvasY ?? 300,
        assigneeIds: body.assigneeIds ?? [],
        dependencies: [],
        dependents: [],
      };

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: [...previous.tasks, optimistic],
        });
      }

      const ctx = { previous, tempId };
      return (await options?.onMutate?.(body, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useUpdateTaskMutation(
  options?: UseMutationOptions<
    ApiTask,
    Error,
    { taskId: string; body: UpdateTaskBody },
    CanvasCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, body }) => apiClient.updateTask(taskId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const positionOnly = isPositionOnlyBody(vars.body);
      const previousNodes = positionOnly
        ? useCanvasStore.getState().nodes
        : undefined;

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) => {
            if (t.id !== vars.taskId) return t;
            return {
              ...t,
              title: vars.body.title ?? t.title,
              description:
                vars.body.description !== undefined
                  ? vars.body.description
                  : t.description,
              status: vars.body.status ?? t.status,
              priority: vars.body.priority ?? t.priority,
              effortEstimate:
                vars.body.effortEstimate !== undefined
                  ? vars.body.effortEstimate
                  : t.effortEstimate,
              dueDate:
                vars.body.dueDate !== undefined ? vars.body.dueDate : t.dueDate,
              phaseId: vars.body.phaseId ?? t.phaseId,
              assigneeIds: vars.body.assigneeIds ?? t.assigneeIds,
              canvasX: vars.body.canvasX ?? t.canvasX,
              canvasY: vars.body.canvasY ?? t.canvasY,
            };
          }),
        });
      }

      const ctx: CanvasCtx = { previous, previousNodes, positionOnly };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.positionOnly && onMutateResult.previousNodes) {
        useCanvasStore.getState().setNodes(onMutateResult.previousNodes);
        logOnce(
          "drag-rollback",
          `[OrgGraph] drag save failed, rolling back position for task ${vars.taskId}`,
        );
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSuccess: (data, vars, onMutateResult, ctx) => {
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const existing = previous?.tasks.find((t) => t.id === vars.taskId);
      const merged = toApiTask(data, existing);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === vars.taskId ? merged : t,
          ),
        });
      }
      if (isPositionOnlyBody(vars.body)) {
        logDevOnce(
          "drag-confirmed",
          `[OrgGraph] drag position saved for task ${vars.taskId}`,
        );
      }
      options?.onSuccess?.(data, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      if (!isPositionOnlyBody(vars.body)) {
        void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      }
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useArchiveTaskMutation(
  options?: UseMutationOptions<ApiTask, Error, string, CanvasCtx>,
) {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);

  return useMutation({
    mutationFn: (taskId) => apiClient.archiveTask(taskId),
    ...options,
    onMutate: async (taskId, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousNodes = useCanvasStore.getState().nodes;
      const previousEdges = useCanvasStore.getState().edges;

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== taskId),
        });
      }

      setNodes((nodes) => nodes.filter((n) => n.id !== `task-${taskId}`));
      setEdges((edges) =>
        edges.filter(
          (e) => e.source !== `task-${taskId}` && e.target !== `task-${taskId}`,
        ),
      );

      const ctx = { previous, previousNodes, previousEdges };
      return (await options?.onMutate?.(taskId, context)) ?? ctx;
    },
    onError: (err, taskId, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousNodes) setNodes(onMutateResult.previousNodes);
      if (onMutateResult?.previousEdges) setEdges(onMutateResult.previousEdges);
      options?.onError?.(err, taskId, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useAddDependencyMutation(
  options?: UseMutationOptions<
    { dependencies: string[]; dependents: string[] },
    Error,
    { taskId: string; upstreamTaskId: string },
    CanvasCtx
  >,
) {
  const queryClient = useQueryClient();
  const setEdges = useCanvasStore((s) => s.setEdges);

  return useMutation({
    mutationFn: ({ taskId, upstreamTaskId }) =>
      apiClient.addDependency(taskId, upstreamTaskId),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousEdges = useCanvasStore.getState().edges;

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) => {
            if (t.id !== vars.taskId) return t;
            if (t.dependencies.includes(vars.upstreamTaskId)) return t;
            return {
              ...t,
              dependencies: [...t.dependencies, vars.upstreamTaskId],
            };
          }),
        });
      }

      setEdges((edges) => {
        const edge = dependencyEdge(vars.upstreamTaskId, vars.taskId);
        if (edges.some((e) => e.id === edge.id)) return edges;
        return [...edges, edge];
      });

      const ctx = { previous, previousEdges };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousEdges) setEdges(onMutateResult.previousEdges);
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useRemoveDependencyMutation(
  options?: UseMutationOptions<
    { dependencies: string[]; dependents: string[] },
    Error,
    { taskId: string; upstreamTaskId: string },
    CanvasCtx
  >,
) {
  const queryClient = useQueryClient();
  const setEdges = useCanvasStore((s) => s.setEdges);

  return useMutation({
    mutationFn: ({ taskId, upstreamTaskId }) =>
      apiClient.removeDependency(taskId, upstreamTaskId),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousEdges = useCanvasStore.getState().edges;

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) => {
            if (t.id !== vars.taskId) return t;
            return {
              ...t,
              dependencies: t.dependencies.filter(
                (id) => id !== vars.upstreamTaskId,
              ),
            };
          }),
        });
      }

      setEdges((edges) =>
        edges.filter((e) => e.id !== `dep-${vars.upstreamTaskId}-${vars.taskId}`),
      );

      const ctx = { previous, previousEdges };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousEdges) setEdges(onMutateResult.previousEdges);
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}
