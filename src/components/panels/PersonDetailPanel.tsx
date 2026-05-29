"use client";

import React, { useCallback, useMemo, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import {
  useCreateOrgRoleMutation,
  useDeleteOrgRoleMutation,
  useUpdateUserMutation,
} from "@/lib/api/useProjectMutations";
import type { ApiUser } from "@/lib/api/types";
import type { OrgRole } from "@/types/project-extensions";
import type { TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
};

const ACCENT_DOT: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#E8AF34]",
  violet: "bg-[#A86FDF]",
  sky: "bg-[#5591C7]",
  mint: "bg-[#6DAA45]",
};

function workloadBadge(taskCount: number): {
  label: string;
  className: string;
} {
  if (taskCount >= 10) {
    return {
      label: "overloaded",
      className: "bg-[#DD6974]/10 text-[#DD6974]",
    };
  }
  if (taskCount >= 7) {
    return { label: "heavy", className: "bg-[#E8AF34]/10 text-[#E8AF34]" };
  }
  if (taskCount >= 4) {
    return { label: "medium", className: "bg-primary/10 text-primary" };
  }
  return { label: "light", className: "bg-[#6DAA45]/10 text-[#6DAA45]" };
}

function InlineEdit({
  value,
  onSave,
  disabled,
  className = "",
}: {
  value: string;
  onSave: (next: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`text-body-sm w-full rounded-lg border border-primary bg-surface-container px-2 py-1 text-on-surface outline-none ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`text-left hover:text-primary ${className}`}
    >
      {value}
    </button>
  );
}

export const PersonDetailPanel = React.memo(function PersonDetailPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const selectNode = useCanvasStore((s) => s.selectNode);

  const { data: graph } = useOrgGraphData();
  const updateUser = useUpdateUserMutation();
  const createOrgRole = useCreateOrgRoleMutation();
  const deleteOrgRole = useDeleteOrgRoleMutation();

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState({
    title: "",
    rank: "1",
    isTeacherInCharge: false,
  });

  const userId = useMemo(() => {
    if (!selectedNodeId || selectedNodeType !== "person") return null;
    return selectedNodeId.replace("person-", "");
  }, [selectedNodeId, selectedNodeType]);

  const user: ApiUser | null = useMemo(() => {
    if (!userId || !graph) return null;
    return graph.users.find((u) => u.id === userId) ?? null;
  }, [userId, graph]);

  const userTasks = useMemo(() => {
    if (!userId || !graph) return [];
    return graph.tasks.filter((t) => t.assigneeIds.includes(userId));
  }, [userId, graph]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      not_started: 0,
      in_progress: 0,
      blocked: 0,
      in_review: 0,
      done: 0,
    };
    for (const task of userTasks) {
      const status = task.status as TaskStatus;
      if (status in counts) counts[status] += 1;
    }
    return counts;
  }, [userTasks]);

  const assignedProjects = useMemo(() => {
    if (!graph || !userId) return [];
    const projectIds = new Set(userTasks.map((t) => t.projectId));
    return graph.projects
      .filter((p) => projectIds.has(p.id))
      .map((p) => ({
        ...p,
        taskCount: userTasks.filter((t) => t.projectId === p.id).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [graph, userId, userTasks]);

  const orgRoles: OrgRole[] = useMemo(() => {
    if (!userId || !graph?.orgRoles) return [];
    return graph.orgRoles
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.rank - b.rank);
  }, [userId, graph?.orgRoles]);

  const handleClose = useCallback(() => {
    selectNode(null, null);
  }, [selectNode]);

  const patchUser = useCallback(
    (body: { name?: string; role?: string }) => {
      if (!userId) return;
      void updateUser.mutate({ userId, body });
    },
    [userId, updateUser],
  );

  if (!user || !userId) return null;

  const load = workloadBadge(userTasks.length);
  const maxStatusCount = Math.max(...Object.values(statusBreakdown), 1);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-white/[0.06] p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-body-md font-bold text-primary">
            {user.initials.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-section-header mb-1 text-on-surface-variant">
              Member identity
            </p>
            <InlineEdit
              value={user.name}
              disabled={updateUser.isPending}
              onSave={(name) => patchUser({ name })}
              className="text-headline-sm font-semibold text-on-surface"
            />
            <p className="text-body-sm mt-1 text-on-surface-variant">
              {user.email}
            </p>
            <div className="mt-2">
              <InlineEdit
                value={user.role}
                disabled={updateUser.isPending}
                onSave={(role) => patchUser({ role })}
                className="text-body-sm text-on-surface-variant"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-white/10"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-white/[0.06] p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Org roles
          </p>
          <div className="space-y-2">
            {orgRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
              >
                <span className="font-mono-label rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                  #{role.rank}
                </span>
                <span className="text-body-sm flex-1 text-on-surface">
                  {role.title}
                </span>
                {role.isTeacherInCharge && (
                  <span className="text-body-sm" aria-label="Teacher in charge">
                    🍎
                  </span>
                )}
                <button
                  type="button"
                  disabled={deleteOrgRole.isPending}
                  onClick={() => void deleteOrgRole.mutate(role.id)}
                  className="text-on-surface-variant hover:text-[#DD6974]"
                  aria-label="Remove role"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          {showRoleForm ? (
            <div className="mt-3 space-y-2 rounded-lg border border-white/10 p-3">
              <input
                value={roleForm.title}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Title"
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <input
                type="number"
                min={1}
                max={99}
                value={roleForm.rank}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, rank: e.target.value }))
                }
                placeholder="Rank (1–99)"
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={roleForm.isTeacherInCharge}
                  onChange={(e) =>
                    setRoleForm((f) => ({
                      ...f,
                      isTeacherInCharge: e.target.checked,
                    }))
                  }
                />
                Teacher in charge
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={createOrgRole.isPending}
                  onClick={() => {
                    const rank = Number(roleForm.rank);
                    if (!roleForm.title.trim() || rank < 1 || rank > 99) return;
                    void createOrgRole.mutate(
                      {
                        userId,
                        title: roleForm.title.trim(),
                        rank,
                        isTeacherInCharge: roleForm.isTeacherInCharge,
                      },
                      {
                        onSuccess: () => {
                          setRoleForm({
                            title: "",
                            rank: "1",
                            isTeacherInCharge: false,
                          });
                          setShowRoleForm(false);
                        },
                      },
                    );
                  }}
                  className="text-body-sm flex-1 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary disabled:opacity-50"
                >
                  {createOrgRole.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoleForm(false)}
                  className="text-body-sm flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRoleForm(true)}
              className="text-body-sm mt-2 text-primary hover:underline"
            >
              + Assign role
            </button>
          )}
        </div>

        <div className="border-b border-white/[0.06] p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Assigned projects
          </p>
          {assignedProjects.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No projects yet</p>
          ) : (
            <div className="space-y-1.5">
              {assignedProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    selectNode(`project-${project.id}`, "project")
                  }
                  className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2 text-left hover:border-white/15"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${ACCENT_DOT[project.color] ?? "bg-primary"}`}
                  />
                  <span className="text-body-sm flex-1 truncate text-on-surface">
                    {project.name}
                  </span>
                  <span className="font-mono-label text-[10px] text-on-surface-variant">
                    {project.taskCount} tasks
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Workload summary
          </p>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-body-sm text-on-surface">
              {userTasks.length} total tasks
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-body-sm capitalize ${load.className}`}
            >
              {load.label}
            </span>
          </div>
          <div className="space-y-2">
            {(Object.keys(statusBreakdown) as TaskStatus[]).map((status) => {
              const count = statusBreakdown[status];
              if (count === 0) return null;
              return (
                <div key={status}>
                  <div className="mb-0.5 flex justify-between">
                    <span className="text-body-sm text-on-surface-variant">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="font-mono-label text-[10px] text-on-surface-variant">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(count / maxStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
