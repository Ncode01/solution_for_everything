"use client";

import React from "react";
import type {
  ApiPhase,
  ApiProject,
  ApiUser,
  CreateTaskBody,
  UpdateTaskBody,
} from "@/lib/api/types";
import type { TaskPriority, TaskStatus } from "@/types";

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  effortEstimate: string;
  dueDate: string;
  projectId: string;
  phaseId: string;
  assigneeIds: string[];
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface TaskFormProps {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  projects: ApiProject[];
  phases: ApiPhase[];
  users: ApiUser[];
  isCreate: boolean;
}

export function TaskForm({
  values,
  onChange,
  projects,
  phases,
  users,
  isCreate,
}: TaskFormProps) {
  const projectPhases = phases.filter((p) => p.projectId === values.projectId);

  const set = <K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K],
  ) => onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
          Title
        </span>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          required
          className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
          Description
        </span>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="text-body-sm resize-none rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
            Status
          </span>
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as TaskStatus)}
            className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
            Priority
          </span>
          <select
            value={values.priority}
            onChange={(e) => set("priority", e.target.value as TaskPriority)}
            className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
            Effort (hours)
          </span>
          <input
            type="number"
            min={0}
            value={values.effortEstimate}
            onChange={(e) => set("effortEstimate", e.target.value)}
            className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
            Due date
          </span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
          />
        </label>
      </div>

      {isCreate && (
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
              Project
            </span>
            <select
              value={values.projectId}
              onChange={(e) => {
                const projectId = e.target.value;
                const firstPhase = phases.find((p) => p.projectId === projectId);
                onChange({
                  ...values,
                  projectId,
                  phaseId: firstPhase?.id ?? "",
                });
              }}
              className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
              Phase
            </span>
            <select
              value={values.phaseId}
              onChange={(e) => set("phaseId", e.target.value)}
              className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary"
            >
              {projectPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!isCreate && (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
            Phase
          </span>
          <select
            value={values.phaseId}
            onChange={(e) => set("phaseId", e.target.value)}
            className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface outline-none focus:border-primary"
          >
            {projectPhases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div>
        <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
          Assignees
        </p>
        <div className="flex flex-wrap gap-2">
          {users.map((user) => {
            const selected = values.assigneeIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? values.assigneeIds.filter((id) => id !== user.id)
                    : [...values.assigneeIds, user.id];
                  set("assigneeIds", next);
                }}
                className={[
                  "rounded-lg border px-2.5 py-1 text-body-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-white/10 text-on-surface-variant hover:bg-white/5",
                ].join(" ")}
              >
                {user.initials} · {user.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function formValuesToCreateBody(
  values: TaskFormValues,
): CreateTaskBody {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    effortEstimate: values.effortEstimate
      ? Number(values.effortEstimate)
      : null,
    dueDate: values.dueDate || null,
    projectId: values.projectId,
    phaseId: values.phaseId,
    assigneeIds: values.assigneeIds,
  };
}

export function formValuesToUpdateBody(
  values: TaskFormValues,
): UpdateTaskBody {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    effortEstimate: values.effortEstimate
      ? Number(values.effortEstimate)
      : null,
    dueDate: values.dueDate || null,
    phaseId: values.phaseId,
    assigneeIds: values.assigneeIds,
  };
}
