"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCanvasEvents } from "@/lib/firebase/useCanvasEvents";
import { useCPMSync } from "@/lib/canvas/useCPMSync";
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

  const createTask = useCreateTaskMutation({
    onSuccess: (task) => {
      void publishEvent("task_created", task.id, { task });
    },
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const updateTask = useUpdateTaskMutation({
    onSuccess: (task) => {
      void publishEvent("task_updated", task.id, { task });
    },
    onSettled: async () => {
      await invalidateAndRecompute();
    },
  });

  const archiveTask = useArchiveTaskMutation({
    onSuccess: (task) => {
      void publishEvent("task_archived", task.id, {});
    },
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
