"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCanvasEvents } from "@/lib/firebase/useCanvasEvents";
import { useCPMSync } from "@/lib/canvas/useCPMSync";
import { useUIStore } from "@/stores/ui.store";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useArchiveTaskMutation,
  useAddDependencyMutation,
  useRemoveDependencyMutation,
} from "./useTaskMutations";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useMutationOrchestrator() {
  const { publishEvent } = useCanvasEvents({ listen: false });
  const { recomputeCPM } = useCPMSync();
  const queryClient = useQueryClient();

  const invalidateAndRecompute = async () => {
    await queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
    recomputeCPM();
  };

  const toastSuccess = (message: string) =>
    useUIStore.getState().addToast("success", message);
  const toastError = (error: Error) =>
    useUIStore.getState().addToast("error", error.message);

  const createTask = useCreateTaskMutation({
    onSuccess: (task) => {
      toastSuccess("Task created");
      void publishEvent("task_created", task.id, { task });
    },
    onError: toastError,
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const updateTask = useUpdateTaskMutation({
    onSuccess: (task) => {
      toastSuccess("Task saved");
      void publishEvent("task_updated", task.id, { task });
    },
    onError: toastError,
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const archiveTask = useArchiveTaskMutation({
    onSuccess: (task) => {
      toastSuccess("Task archived");
      void publishEvent("task_archived", task.id, {});
    },
    onError: toastError,
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const addDependency = useAddDependencyMutation({
    onSuccess: (_result, vars) => {
      void publishEvent("dependency_added", vars.taskId, {
        upstreamTaskId: vars.upstreamTaskId,
      });
    },
    onError: toastError,
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const removeDependency = useRemoveDependencyMutation({
    onSuccess: (_result, vars) => {
      void publishEvent("dependency_removed", vars.taskId, {
        upstreamTaskId: vars.upstreamTaskId,
      });
    },
    onError: toastError,
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  return {
    createTask,
    updateTask,
    archiveTask,
    addDependency,
    removeDependency,
  };
}
