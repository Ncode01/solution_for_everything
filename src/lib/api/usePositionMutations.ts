"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { logDevOnce, logOnce } from "@/lib/diagnostics";
import type { OrgGraphResponse, PositionBody } from "./types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

type PositionCtx = {
  previous?: OrgGraphResponse;
  previousNodes?: ReturnType<typeof useCanvasStore.getState>["nodes"];
};

export function applyOptimisticProjectPosition(
  queryClient: QueryClient,
  projectId: string,
  canvasX: number,
  canvasY: number,
): void {
  queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, canvasX, canvasY } : p,
      ),
    };
  });
}

export function applyOptimisticMilestonePosition(
  queryClient: QueryClient,
  milestoneId: string,
  canvasX: number,
  canvasY: number,
): void {
  queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      milestones: (prev.milestones ?? []).map((m) =>
        m.id === milestoneId ? { ...m, canvasX, canvasY } : m,
      ),
    };
  });
}

export function useUpdateProjectPositionMutation(
  options?: UseMutationOptions<
    { id: string; canvasX: number | null; canvasY: number | null },
    Error,
    { projectId: string; body: PositionBody },
    PositionCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, body }) =>
      apiClient.updateProjectPosition(ORG_ID, projectId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousNodes = useCanvasStore.getState().nodes;

      applyOptimisticProjectPosition(
        queryClient,
        vars.projectId,
        vars.body.canvasX,
        vars.body.canvasY,
      );

      const ctx: PositionCtx = { previous, previousNodes };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousNodes) {
        useCanvasStore.getState().setNodes(onMutateResult.previousNodes);
        logOnce(
          "project-drag-rollback",
          `[OrgGraph] project drag save failed, rolling back ${vars.projectId}`,
        );
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSuccess: (data, vars, onMutateResult, ctx) => {
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      if (previous && data.canvasX != null && data.canvasY != null) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          projects: previous.projects.map((p) =>
            p.id === vars.projectId
              ? { ...p, canvasX: data.canvasX, canvasY: data.canvasY }
              : p,
          ),
        });
      }
      logDevOnce(
        "project-drag-confirmed",
        `[OrgGraph] project position saved for ${vars.projectId}`,
      );
      options?.onSuccess?.(data, vars, onMutateResult, ctx);
    },
  });
}

export function useUpdateMilestonePositionMutation(
  options?: UseMutationOptions<
    { id: string; canvasX: number | null; canvasY: number | null },
    Error,
    { milestoneId: string; body: PositionBody },
    PositionCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, body }) =>
      apiClient.updateMilestonePosition(ORG_ID, milestoneId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousNodes = useCanvasStore.getState().nodes;

      applyOptimisticMilestonePosition(
        queryClient,
        vars.milestoneId,
        vars.body.canvasX,
        vars.body.canvasY,
      );

      const ctx: PositionCtx = { previous, previousNodes };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousNodes) {
        useCanvasStore.getState().setNodes(onMutateResult.previousNodes);
        logOnce(
          "milestone-drag-rollback",
          `[OrgGraph] milestone drag save failed, rolling back ${vars.milestoneId}`,
        );
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSuccess: (data, vars, onMutateResult, ctx) => {
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      if (previous && data.canvasX != null && data.canvasY != null) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          milestones: (previous.milestones ?? []).map((m) =>
            m.id === vars.milestoneId
              ? { ...m, canvasX: data.canvasX, canvasY: data.canvasY }
              : m,
          ),
        });
      }
      logDevOnce(
        "milestone-drag-confirmed",
        `[OrgGraph] milestone position saved for ${vars.milestoneId}`,
      );
      options?.onSuccess?.(data, vars, onMutateResult, ctx);
    },
  });
}
