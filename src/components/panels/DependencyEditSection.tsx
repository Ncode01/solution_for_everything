"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Task } from "@/types";
import type { UseMutationResult } from "@tanstack/react-query";

interface DependencyEditSectionProps {
  task: Task;
  allTasks: Task[];
  addDependency: UseMutationResult<
    { dependencies: string[]; dependents: string[] },
    Error,
    { taskId: string; upstreamTaskId: string },
    unknown
  >;
  removeDependency: UseMutationResult<
    { dependencies: string[]; dependents: string[] },
    Error,
    { taskId: string; upstreamTaskId: string },
    unknown
  >;
}

export function DependencyEditSection({
  task,
  allTasks,
  addDependency,
  removeDependency,
}: DependencyEditSectionProps) {
  const [selectedUpstream, setSelectedUpstream] = useState("");
  const [depError, setDepError] = useState<string | null>(null);

  const pending =
    addDependency.isPending || removeDependency.isPending;

  const dependencyTasks = useMemo(() => {
    const byId = new Map(allTasks.map((t) => [t.id, t]));
    return task.dependencies
      .map((id) => byId.get(id))
      .filter((t): t is Task => Boolean(t));
  }, [task.dependencies, allTasks]);

  const addableTasks = useMemo(() => {
    const blocked = new Set([
      task.id,
      ...task.dependencies,
      ...task.dependents,
    ]);
    return allTasks.filter(
      (t) =>
        t.projectId === task.projectId &&
        !blocked.has(t.id),
    );
  }, [allTasks, task]);

  const handleAdd = async () => {
    if (!selectedUpstream) return;
    setDepError(null);
    try {
      await addDependency.mutateAsync({
        taskId: task.id,
        upstreamTaskId: selectedUpstream,
      });
      setSelectedUpstream("");
    } catch (e: unknown) {
      setDepError(e instanceof Error ? e.message : "Failed to add dependency");
    }
  };

  const handleRemove = async (upstreamId: string) => {
    setDepError(null);
    try {
      await removeDependency.mutateAsync({
        taskId: task.id,
        upstreamTaskId: upstreamId,
      });
    } catch (e: unknown) {
      setDepError(
        e instanceof Error ? e.message : "Failed to remove dependency",
      );
    }
  };

  return (
    <div className="border-t border-white/[0.06] p-4">
      <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
        Dependencies
      </p>

      {dependencyTasks.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {dependencyTasks.map((dep) => (
            <span
              key={dep.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-container-low px-2 py-1 text-[11px] text-on-surface"
            >
              {dep.title}
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleRemove(dep.id)}
                className="text-on-surface-variant hover:text-[#DD6974] disabled:opacity-40"
                aria-label={`Remove dependency ${dep.title}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={selectedUpstream}
          disabled={pending || addableTasks.length === 0}
          onChange={(e) => setSelectedUpstream(e.target.value)}
          className="text-body-sm min-w-0 flex-1 rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="">Add upstream task…</option>
          {addableTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !selectedUpstream}
          onClick={() => void handleAdd()}
          className="text-body-sm shrink-0 rounded-lg border border-white/10 px-3 py-2 text-on-surface-variant hover:bg-white/5 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {depError && (
        <p className="text-body-sm mt-2 text-[#DD6974]">{depError}</p>
      )}
    </div>
  );
}
