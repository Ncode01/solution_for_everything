"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Calendar,
  Clock,
  GitBranch,
  AlertTriangle,
  Flag,
  Pencil,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { computeCPM, computeCascadeImpact } from "@/lib/cpm";
import type { CPMTask } from "@/lib/cpm";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { useMutationOrchestrator } from "@/lib/api/useMutationOrchestrator";
import { DependencyEditSection } from "./DependencyEditSection";
import type {
  Project,
  ProjectAccentColor,
  Task,
  TaskCardNodeData,
  ProjectClusterNodeData,
  TaskStatus,
} from "@/types";
import { apiTaskToDomain } from "@/lib/spark/sparkTasksGraph";
import type { UpdateTaskBody } from "@/lib/api/types";
import type { TaskFormValues } from "./TaskForm";
import {
  TaskForm,
  formValuesToCreateBody,
  formValuesToUpdateBody,
} from "./TaskForm";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

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
  in_review: "text-[#A86FDF]",
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

function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    effortEstimate:
      task.effortEstimate !== undefined ? String(task.effortEstimate) : "",
    dueDate: task.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : "",
    projectId: task.projectId,
    phaseId: task.phaseId,
    assigneeIds: [...task.assigneeIds],
  };
}

function emptyCreateValues(
  projectId: string,
  phaseId: string,
): TaskFormValues {
  return {
    title: "",
    description: "",
    status: "not_started",
    priority: "medium",
    effortEstimate: "",
    dueDate: "",
    projectId,
    phaseId,
    assigneeIds: [],
  };
}

export const TaskDetailPanel = React.memo(function TaskDetailPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setCascadeImpact = useCanvasStore((s) => s.setCascadeImpact);
  const setCascadeChain = useCanvasStore((s) => s.setCascadeChain);

  const rightPanelMode = useUIStore((s) => s.rightPanelMode);
  const taskCreateDefaults = useUIStore((s) => s.taskCreateDefaults);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openTaskView = useUIStore((s) => s.openTaskView);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const { data: graph } = useOrgGraphData();

  const { createTask, updateTask, archiveTask, addDependency, removeDependency } =
    useMutationOrchestrator();
  const [formError, setFormError] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  const graphTasks = useMemo((): Task[] => {
    if (!graph?.tasks) return [];
    const cpmTasks: CPMTask[] = graph.tasks.map((t) => ({
      id: t.id,
      duration: Math.max(1, t.effortEstimate ?? 8),
      dependencies: t.dependencies,
      dependents: t.dependents,
      status: t.status,
    }));
    const cpmResult = computeCPM(cpmTasks);
    return graph.tasks.map((api) =>
      apiTaskToDomain(api, cpmResult.nodes[api.id]?.isCriticalPath ?? false),
    );
  }, [graph?.tasks]);

  const allTasks = useMemo(() => {
    const fromNodes = nodes
      .filter((n) => n.id.startsWith("task-"))
      .map((n) => (n.data as TaskCardNodeData).task);
    if (fromNodes.length > 0) return fromNodes;
    return graphTasks;
  }, [nodes, graphTasks]);

  const task: Task | null = useMemo(() => {
    if (!selectedNodeId || selectedNodeType !== "task") return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) return (node.data as TaskCardNodeData).task;
    const taskId = selectedNodeId.replace("task-", "");
    return graphTasks.find((t) => t.id === taskId) ?? null;
  }, [selectedNodeId, selectedNodeType, nodes, graphTasks]);

  const project = useMemo((): Project | null => {
    if (!task) return null;
    const projectNode = nodes.find((n) => n.id === `project-${task.projectId}`);
    if (projectNode) {
      return (projectNode.data as ProjectClusterNodeData).project;
    }
    const apiProject = graph?.projects.find((p) => p.id === task.projectId);
    if (!apiProject) return null;
    return {
      id: apiProject.id,
      orgId: apiProject.orgId,
      name: apiProject.name,
      color: (apiProject.color as ProjectAccentColor) ?? "sky",
      status: apiProject.status as Project["status"],
      ownerId: apiProject.ownerId ?? "",
      completionPercent: apiProject.completionPercent,
      phases: [],
      members: [],
    };
  }, [task, nodes, graph?.projects]);

  const assignees = useMemo(() => {
    if (!task) return [];
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) return (node.data as TaskCardNodeData).assignees;
    if (!graph) return [];
    return task.assigneeIds
      .map((id) => graph.users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({
        id: u!.id,
        orgId: u!.orgId,
        name: u!.name,
        initials: u!.initials,
        email: u!.email,
        role: u!.role,
        avatarUrl: u!.avatarUrl ?? undefined,
        loadLevel: "available" as const,
        taskCount: 0,
        loadPercent: 0,
      }));
  }, [task, nodes, selectedNodeId, graph]);

  const dependencyTasks = useMemo(() => {
    if (!task) return [];
    const byId = new Map(allTasks.map((t) => [t.id, t]));
    return task.dependencies
      .map((id) => byId.get(id))
      .filter((t): t is Task => Boolean(t));
  }, [task, allTasks]);

  const blockedTasks = useMemo(() => {
    if (!task) return [];
    const byId = new Map(allTasks.map((t) => [t.id, t]));
    return task.dependents
      .map((id) => byId.get(id))
      .filter((t): t is Task => Boolean(t));
  }, [task, allTasks]);

  const phaseName = useMemo(() => {
    if (!task || !graph) return "";
    return graph.phases.find((p) => p.id === task.phaseId)?.name ?? "";
  }, [task, graph]);

  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title);
    setDescDraft(task.description ?? "");
  }, [task?.id, task?.title, task?.description]);

  const patchTask = useCallback(
    (body: UpdateTaskBody) => {
      if (!task) return;
      void updateTask.mutateAsync({ taskId: task.id, body });
    },
    [task, updateTask],
  );

  useEffect(() => {
    if (!task || rightPanelMode !== "task-view") return;
    if (descDraft === (task.description ?? "")) return;

    if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
    descDebounceRef.current = setTimeout(() => {
      patchTask({ description: descDraft || null });
    }, 500);

    return () => {
      if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
    };
  }, [descDraft, task, rightPanelMode, patchTask]);

  const defaultProjectId =
    graph?.projects[0]?.id ?? task?.projectId ?? "";
  const defaultPhaseId =
    taskCreateDefaults?.phaseId ??
    graph?.phases.find((p) => p.projectId === defaultProjectId)?.id ??
    task?.phaseId ??
    "";

  const [formValues, setFormValues] = useState<TaskFormValues>(() =>
    emptyCreateValues(defaultProjectId, defaultPhaseId),
  );

  useEffect(() => {
    if (rightPanelMode === "task-create") {
      setFormValues(
        emptyCreateValues(
          taskCreateDefaults?.projectId ?? defaultProjectId,
          taskCreateDefaults?.phaseId ?? defaultPhaseId,
        ),
      );
      setFormError(null);
    } else if (rightPanelMode === "task-edit" && task) {
      setFormValues(taskToFormValues(task));
      setFormError(null);
    }
  }, [
    rightPanelMode,
    task,
    taskCreateDefaults,
    defaultProjectId,
    defaultPhaseId,
  ]);

  const handleClose = useCallback(() => {
    selectNode(null, null);
    useCanvasStore.getState().dismissCascade();
    closeRightPanel();
  }, [selectNode, closeRightPanel]);

  useEffect(() => {
    if (rightPanelMode !== "task-view" || !task) {
      return;
    }
    if (task.status !== "blocked") {
      setCascadeImpact(null);
      setCascadeChain(null);
      return;
    }

    const cpmlTasks: CPMTask[] = allTasks.map((t) => ({
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
  }, [
    task,
    allTasks,
    setCascadeImpact,
    setCascadeChain,
    rightPanelMode,
  ]);

  const handleSaveCreate = async () => {
    setFormError(null);
    try {
      const created = await createTask.mutateAsync(
        formValuesToCreateBody(formValues),
      );
      selectNode(`task-${created.id}`, "task");
      openTaskView();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create task");
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;
    setFormError(null);
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        body: formValuesToUpdateBody(formValues),
      });
      openTaskView();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  if (rightPanelMode === "task-create") {
    if (!graph) return null;
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <PanelHeader title="New task" onClose={handleClose} />
        <div className="flex-1 overflow-y-auto">
          <TaskForm
            values={formValues}
            onChange={setFormValues}
            projects={graph.projects}
            phases={graph.phases}
            users={graph.users}
            isCreate
          />
        </div>
        <FormActions
          error={formError}
          pending={createTask.isPending}
          onCancel={handleClose}
          onSave={() => void handleSaveCreate()}
          saveLabel="Create task"
        />
      </div>
    );
  }

  if (rightPanelMode === "task-edit" && task && graph) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <PanelHeader title="Edit task" onClose={handleClose} />
        <div className="flex-1 overflow-y-auto">
          <TaskForm
            values={formValues}
            onChange={setFormValues}
            projects={graph.projects}
            phases={graph.phases}
            users={graph.users}
            isCreate={false}
          />
          <DependencyEditSection
            task={task}
            allTasks={allTasks}
            addDependency={addDependency}
            removeDependency={removeDependency}
          />
        </div>
        <FormActions
          error={formError}
          pending={updateTask.isPending}
          onCancel={openTaskView}
          onSave={() => void handleSaveEdit()}
          saveLabel="Save changes"
        />
      </div>
    );
  }

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
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              const trimmed = titleDraft.trim();
              if (trimmed && trimmed !== task.title) {
                patchTask({ title: trimmed });
              } else {
                setTitleDraft(task.title);
              }
            }}
            className="text-headline-sm w-full rounded-lg border border-transparent bg-transparent font-semibold leading-snug text-on-surface outline-none focus:border-primary focus:bg-surface-container px-1 -mx-1"
            aria-label="Task title"
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={openTaskEdit}
            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/10"
            aria-label="Edit task"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/10"
            aria-label="Close panel"
          >
            <X size={14} />
          </button>
        </div>
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
          <select
            value={task.status}
            onChange={(e) =>
              patchTask({ status: e.target.value as TaskStatus })
            }
            className={`text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 font-medium outline-none focus:border-primary ${STATUS_COLORS[task.status]}`}
            aria-label="Task status"
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
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
        <div>
          <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
            Due
          </p>
          <input
            type="date"
            value={
              task.dueDate
                ? new Date(task.dueDate).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) =>
              patchTask({ dueDate: e.target.value || null })
            }
            className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 text-on-surface outline-none focus:border-primary"
            aria-label="Due date"
          />
        </div>
        <div>
          <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
            Phase
          </p>
          <p className="text-body-sm text-on-surface">{phaseName || "—"}</p>
        </div>
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
        <p className="text-section-header mb-2 text-on-surface-variant">
          Details
        </p>
        <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
          Assigned to
        </p>
        {graph ? (
          <div className="flex flex-wrap gap-1.5">
            {graph.users.map((user) => {
              const selected = task.assigneeIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? task.assigneeIds.filter((id) => id !== user.id)
                      : [...task.assigneeIds, user.id];
                    patchTask({ assigneeIds: next });
                  }}
                  className={
                    selected
                      ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-body-sm text-on-surface"
                      : "rounded-full border border-white/10 px-2.5 py-1 text-body-sm text-on-surface-variant hover:bg-white/5"
                  }
                >
                  {user.initials} {user.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {assignees.map((user) => (
              <div key={user.id} className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-[11px] font-bold text-on-surface">
                  {user.initials}
                </div>
                <p className="text-body-sm text-on-surface">{user.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-white/[0.06] p-4">
        <p className="text-section-header mb-2 text-on-surface-variant">
          Description
        </p>
        <textarea
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
          placeholder="Add a description…"
          rows={4}
          className="text-body-sm w-full resize-y rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none placeholder:text-outline focus:border-primary"
        />
      </div>

      <div className="border-b border-white/[0.06] p-4">
        <p className="text-section-header mb-2 text-on-surface-variant">
          Dependencies
        </p>
        {dependencyTasks.length > 0 ? (
          <>
            <p className="font-mono-label mb-1.5 text-[9px] uppercase text-on-surface-variant">
              Depends on
            </p>
            <div className="mb-3 flex flex-col gap-1.5">
              {dependencyTasks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
                >
                  <div
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      dep.status === "done"
                        ? "bg-[#6DAA45]"
                        : dep.status === "blocked"
                          ? "bg-[#E8AF34]"
                          : "bg-primary"
                    }`}
                  />
                  <span className="text-body-sm truncate text-on-surface">
                    {dep.title}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {blockedTasks.length > 0 ? (
          <>
            <p className="font-mono-label mb-1.5 text-[9px] uppercase text-on-surface-variant">
              Blocks
            </p>
            <div className="mb-3 flex flex-col gap-1.5">
              {blockedTasks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
                >
                  <span className="text-body-sm truncate text-on-surface">
                    {dep.title}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
        <DependencyEditSection
          task={task}
          allTasks={allTasks}
          addDependency={addDependency}
          removeDependency={removeDependency}
        />
      </div>

      <div className="border-b border-white/[0.06] p-4">
        <p className="text-section-header mb-2 text-on-surface-variant">
          Activity
        </p>
        <p className="text-body-sm text-on-surface-variant">
          Activity log coming soon
        </p>
      </div>

      <div className="mt-auto border-t border-white/[0.06] p-4">
        <button
          type="button"
          disabled={archiveTask.isPending}
          onClick={async () => {
            if (!archiveConfirm) {
              setArchiveConfirm(true);
              return;
            }
            try {
              await archiveTask.mutateAsync(task.id);
              selectNode(null, null);
              useCanvasStore.getState().dismissCascade();
              closeRightPanel();
              setArchiveConfirm(false);
            } catch {
              setArchiveConfirm(false);
            }
          }}
          className={
            archiveConfirm
              ? "text-xs font-medium text-[#DD6974] underline"
              : "text-xs text-[#DD6974]/70 underline hover:text-[#DD6974]"
          }
        >
          {archiveConfirm ? "Click again to confirm" : "Archive task"}
        </button>
      </div>
    </div>
  );
});

function PanelHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
      <h2 className="text-headline-sm font-medium text-on-surface">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-white/10"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function FormActions({
  error,
  pending,
  onCancel,
  onSave,
  saveLabel,
}: {
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="border-t border-white/[0.06] p-4">
      {error && (
        <p className="text-body-sm mb-3 rounded-lg border border-[#DD6974]/40 bg-[#DD6974]/10 px-3 py-2 text-[#DD6974]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-body-sm flex-1 rounded-lg border border-white/10 px-4 py-2 text-on-surface-variant hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="text-body-sm flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-50"
        >
          {pending ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
