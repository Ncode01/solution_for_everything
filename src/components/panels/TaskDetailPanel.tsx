"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  GitBranch,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { MOCK_TASKS, MOCK_PROJECTS, USER_MAP } from "@/lib/seed/mockData";
import { computeCPM, computeCascadeImpact } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import type { Task } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  in_review: "In Review",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "text-on-surface-variant",
  in_progress: "text-[#5591C7]",
  blocked: "text-[#DD6974]",
  in_review: "text-[#E8AF34]",
  done: "text-[#6DAA45]",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const ACCENT_COLORS: Record<string, string> = {
  coral: "#E57373",
  amber: "#E8AF34",
  violet: "#9C7EC7",
  sky: "#5591C7",
  mint: "#6DAA45",
};

export const TaskDetailPanel = React.memo(function TaskDetailPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setCascadeImpact = useCanvasStore((s) => s.setCascadeImpact);
  const setCascadeChain = useCanvasStore((s) => s.setCascadeChain);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  const task: Task | null = useMemo(() => {
    if (!selectedNodeId || selectedNodeType !== "task") return null;
    const taskId = selectedNodeId.replace("task-", "");
    return MOCK_TASKS.find((t) => t.id === taskId) ?? null;
  }, [selectedNodeId, selectedNodeType]);

  const project = useMemo(
    () => (task ? MOCK_PROJECTS.find((p) => p.id === task.projectId) : null),
    [task],
  );

  const assignees = useMemo(
    () =>
      task
        ? task.assigneeIds.map((id) => USER_MAP[id]).filter(Boolean)
        : [],
    [task],
  );

  const dependencyTasks = useMemo(
    () =>
      task
        ? task.dependencies
            .map((id) => MOCK_TASKS.find((t) => t.id === id))
            .filter((t): t is Task => Boolean(t))
        : [],
    [task],
  );

  const handleClose = useCallback(() => {
    selectNode(null, null);
    setCascadeImpact(null);
    setCascadeChain(null);
    toggleRightPanel(false);
  }, [selectNode, setCascadeImpact, setCascadeChain, toggleRightPanel]);

  useEffect(() => {
    if (!task || task.status !== "blocked") {
      setCascadeImpact(null);
      setCascadeChain(null);
      return;
    }

    const cpmlTasks: CPMTask[] = MOCK_TASKS.map((t) => ({
      id: t.id,
      duration: t.effortEstimate ?? 8,
      dependencies: t.dependencies,
      dependents: t.dependents,
      status: t.status,
    }));

    const cpmResult = computeCPM(cpmlTasks);
    const impact = computeCascadeImpact(task.id, cpmlTasks, cpmResult);

    setCascadeImpact(impact);
    setCascadeChain(impact.cascadeChain);
  }, [task, setCascadeImpact, setCascadeChain]);

  if (!task || !project) return null;

  const accentColor = ACCENT_COLORS[project.color] ?? "#5591C7";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-white/[0.06] p-4">
        <div className="min-w-0 flex-1 pr-2">
          <div className="mb-2 flex items-center gap-1">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="font-mono-label truncate text-[10px] text-on-surface-variant">
              {project.name}
            </span>
          </div>
          <h2 className="text-headline-sm font-semibold leading-snug text-on-surface">
            {task.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/10"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {task.status === "blocked" && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[#DD6974]/30 bg-[#DD6974]/10 px-3 py-2">
          <AlertTriangle size={13} className="shrink-0 text-[#DD6974]" />
          <span className="text-[11px] font-medium text-[#DD6974]">
            Task is currently blocked
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 border-b border-white/[0.06] p-4">
        <div>
          <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
            Status
          </p>
          <p
            className={`text-body-sm font-medium ${STATUS_COLORS[task.status]}`}
          >
            {STATUS_LABELS[task.status]}
          </p>
        </div>
        <div>
          <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
            Priority
          </p>
          <div className="flex items-center gap-1">
            <Flag
              size={11}
              className={
                task.priority === "critical"
                  ? "text-[#DD6974]"
                  : task.priority === "high"
                    ? "text-[#E8AF34]"
                    : "text-on-surface-variant"
              }
            />
            <p className="text-body-sm text-on-surface">
              {PRIORITY_LABELS[task.priority]}
            </p>
          </div>
        </div>
        {task.dueDate && (
          <div>
            <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
              Due
            </p>
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-on-surface-variant" />
              <p className="text-body-sm text-on-surface">
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
        {task.effortEstimate !== undefined && (
          <div>
            <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
              Effort
            </p>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-on-surface-variant" />
              <p className="text-body-sm text-on-surface">
                {task.effortEstimate}h est.
              </p>
            </div>
          </div>
        )}
      </div>

      {task.isCriticalPath && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[#E8AF34]/20 bg-[#E8AF34]/10 px-3 py-2">
          <GitBranch size={11} className="shrink-0 text-[#E8AF34]" />
          <span className="text-[10px] text-[#E8AF34]">
            On critical path · no float
          </span>
        </div>
      )}
      {!task.isCriticalPath &&
        task.slackTime !== undefined &&
        task.slackTime > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[#6DAA45]/20 bg-[#6DAA45]/10 px-3 py-2">
            <GitBranch size={11} className="shrink-0 text-[#6DAA45]" />
            <span className="text-[10px] text-[#6DAA45]">
              {task.slackTime} days float available
            </span>
          </div>
        )}

      <div className="border-b border-white/[0.06] p-4">
        <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
          Assigned to
        </p>
        <div className="flex flex-col gap-2">
          {assignees.map((user) => (
            <div key={user.id} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-[11px] font-bold text-on-surface">
                {user.initials}
              </div>
              <div>
                <p className="text-body-sm leading-none text-on-surface">
                  {user.name}
                </p>
                <p className="mt-0.5 text-[9px] text-on-surface-variant">
                  {user.role}
                </p>
              </div>
              <div
                className={[
                  "ml-auto h-1.5 w-1.5 shrink-0 rounded-full",
                  user.loadLevel === "available"
                    ? "bg-[#6DAA45]"
                    : user.loadLevel === "at_capacity"
                      ? "bg-[#E8AF34]"
                      : "bg-[#DD6974]",
                ].join(" ")}
              />
            </div>
          ))}
        </div>
      </div>

      {dependencyTasks.length > 0 && (
        <div className="overflow-y-auto p-4">
          <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
            Depends on
          </p>
          <div className="flex flex-col gap-1.5">
            {dependencyTasks.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
              >
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      dep.status === "done"
                        ? "#6DAA45"
                        : dep.status === "blocked"
                          ? "#DD6974"
                          : "#5591C7",
                  }}
                />
                <span className="text-body-sm truncate text-on-surface">
                  {dep.title}
                </span>
                <span
                  className={`font-mono-label ml-auto shrink-0 text-[9px] ${dep.status === "done" ? "text-[#6DAA45]" : "text-on-surface-variant"}`}
                >
                  {dep.status === "done" ? "✓" : STATUS_LABELS[dep.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
