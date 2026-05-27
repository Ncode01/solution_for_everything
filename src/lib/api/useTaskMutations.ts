"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  ApiTask,
  CreateTaskBody,
  OrgGraphResponse,
  UpdateTaskBody,
} from "./types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

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
    dependencies: existing?.dependencies ?? [],
    dependents: existing?.dependents ?? [],
  };
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTaskBody) => apiClient.createTask(body),
    onMutate: async (body) => {
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

      return { previous, tempId };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: UpdateTaskBody;
    }) => apiClient.updateTask(taskId, body),
    onMutate: async ({ taskId, body }) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              title: body.title ?? t.title,
              description:
                body.description !== undefined
                  ? body.description
                  : t.description,
              status: body.status ?? t.status,
              priority: body.priority ?? t.priority,
              effortEstimate:
                body.effortEstimate !== undefined
                  ? body.effortEstimate
                  : t.effortEstimate,
              dueDate:
                body.dueDate !== undefined ? body.dueDate : t.dueDate,
              phaseId: body.phaseId ?? t.phaseId,
              assigneeIds: body.assigneeIds ?? t.assigneeIds,
            };
          }),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], context.previous);
      }
    },
    onSuccess: (data, { taskId }) => {
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const existing = previous?.tasks.find((t) => t.id === taskId);
      const merged = toApiTask(data, existing);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === taskId ? merged : t,
          ),
        });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
    },
  });
}
