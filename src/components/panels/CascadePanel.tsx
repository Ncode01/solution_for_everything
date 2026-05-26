"use client";

import React, { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ArrowRight, GitFork, Clock } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import type { Task, TaskCardNodeData, ProjectClusterNodeData } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  not_started: "#4f4f4d",
  in_progress: "#5591C7",
  blocked: "#DD6974",
  in_review: "#E8AF34",
  done: "#6DAA45",
};

const PROJECT_COLORS: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

function CascadeTaskChip({
  task,
  assignees,
  projectColor,
  isSource,
  isOnCriticalPath,
}: {
  task: Task;
  assignees: TaskCardNodeData["assignees"];
  projectColor: string;
  isSource: boolean;
  isOnCriticalPath: boolean;
}) {
  const accentColor = PROJECT_COLORS[projectColor] ?? PROJECT_COLORS.sky;

  return (
    <div
      className={[
        "w-[180px] shrink-0 rounded-lg border p-3",
        isSource
          ? "border-[#DD6974]/40 bg-[#DD6974]/10"
          : isOnCriticalPath
            ? "border-[#E8AF34]/40 bg-[#E8AF34]/10"
            : "border-white/[0.08] bg-surface-container-low",
      ].join(" ")}
    >
      <div
        className="mb-2 h-0.5 w-full rounded-full"
        style={{ backgroundColor: accentColor, opacity: 0.6 }}
      />
      <div className="mb-1.5 flex items-center gap-1.5">
        <div
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[task.status] }}
        />
        <span className="text-body-sm truncate font-medium text-on-surface">
          {task.title}
        </span>
      </div>
      {assignees.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          {assignees.slice(0, 2).map((u) => (
            <div
              key={u.id}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-container text-[7px] font-bold text-on-surface"
            >
              {u.initials.slice(0, 2)}
            </div>
          ))}
        </div>
      )}
      {isSource && (
        <span className="font-mono-label mt-2 inline-block text-[8px] tracking-wider text-[#DD6974] uppercase">
          ← blocked here
        </span>
      )}
    </div>
  );
}

export const CascadePanel = React.memo(function CascadePanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const cascadeImpact = useCanvasStore((s) => s.cascadeImpact);
  const dismissCascade = useCanvasStore((s) => s.dismissCascade);

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const n of nodes) {
      if (!n.id.startsWith("task-")) continue;
      const t = (n.data as TaskCardNodeData).task;
      map.set(t.id, t);
    }
    return map;
  }, [nodes]);

  const handleDismiss = useCallback(() => {
    dismissCascade();
  }, [dismissCascade]);

  const sourceTask = cascadeImpact
    ? (taskById.get(cascadeImpact.sourceTaskId) ?? null)
    : null;

  const cascadeTasks = cascadeImpact
    ? cascadeImpact.cascadeChain
        .map((id) => taskById.get(id))
        .filter((t): t is Task => Boolean(t))
    : [];

  const projectColorFor = useCallback(
    (task: Task) => {
      const projectNode = nodes.find((n) => n.id === `project-${task.projectId}`);
      return projectNode
        ? (projectNode.data as ProjectClusterNodeData).project.color
        : "sky";
    },
    [nodes],
  );

  const assigneesFor = useCallback(
    (task: Task) => {
      const node = nodes.find((n) => n.id === `task-${task.id}`);
      return node ? (node.data as TaskCardNodeData).assignees : [];
    },
    [nodes],
  );

  return (
    <AnimatePresence>
      {cascadeImpact && (
        <motion.div
          key="cascade-panel"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="pointer-events-auto absolute right-0 bottom-0 left-0 z-20"
          style={{ maxHeight: "280px" }}
        >
          <div className="border-t border-white/[0.08] bg-surface-container shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 pt-4 pb-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <AlertTriangle
                  size={14}
                  className="shrink-0 text-[#E8AF34]"
                />
                <span className="text-body-sm font-semibold text-[#E8AF34]">
                  Cascade Impact
                </span>
                <span className="text-body-sm mx-1 text-on-surface-variant">
                  —
                </span>
                <span className="text-body-sm truncate font-medium text-on-surface">
                  {sourceTask?.title ?? cascadeImpact.sourceTaskId}
                </span>
                {cascadeImpact.criticalPathImpacted && (
                  <span className="font-mono-label ml-1 shrink-0 rounded-full bg-[#DD6974]/20 px-2 py-0.5 text-[9px] text-[#DD6974]">
                    CRITICAL PATH
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <Clock size={12} />
                  <span className="font-mono-label text-[10px]">
                    ~{cascadeImpact.estimatedDelayDays}d delay risk
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/10"
                  aria-label="Dismiss cascade view"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="hide-scrollbar flex items-center gap-0 overflow-x-auto px-5 py-4">
              {sourceTask && (
                <CascadeTaskChip
                  task={sourceTask}
                  assignees={assigneesFor(sourceTask)}
                  projectColor={projectColorFor(sourceTask)}
                  isSource={true}
                  isOnCriticalPath={false}
                />
              )}

              {cascadeTasks.map((task, i) => (
                <React.Fragment key={task.id}>
                  <div className="mx-1 flex shrink-0 items-center gap-0">
                    <div className="h-px w-6 bg-[#E8AF34]/40" />
                    <ArrowRight size={10} className="text-[#E8AF34]/60" />
                  </div>
                  <CascadeTaskChip
                    task={task}
                    assignees={assigneesFor(task)}
                    projectColor={projectColorFor(task)}
                    isSource={false}
                    isOnCriticalPath={
                      cascadeImpact.criticalPathImpacted &&
                      i === cascadeTasks.length - 1
                    }
                  />
                </React.Fragment>
              ))}

              {cascadeTasks.length === 0 && (
                <div className="ml-4 flex items-center gap-2 text-on-surface-variant">
                  <GitFork size={14} />
                  <span className="text-body-sm">No downstream tasks found</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
