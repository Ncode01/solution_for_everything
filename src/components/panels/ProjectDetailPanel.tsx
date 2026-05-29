"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas.store";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import {
  useArchiveProjectMutation,
  useCreateBudgetEntryMutation,
  useCreateMilestoneMutation,
  useCreateProjectOrgMutation,
  useDeleteBudgetEntryMutation,
  useDeleteMilestoneMutation,
  useDeleteProjectOrgMutation,
  useUpdateProjectMutation,
} from "@/lib/api/useProjectMutations";
import { focusCanvasNode } from "@/lib/canvas/reactFlowApi";
import type { ApiPartnerOrg, ApiProject } from "@/lib/api/types";
import type { ProjectAccentColor, ProjectStatus } from "@/types";
import type { ProjectType } from "@/types/project-extensions";

const ACCENT_SWATCHES: { id: ProjectAccentColor; className: string }[] = [
  { id: "coral", className: "bg-[#E05C5C]" },
  { id: "amber", className: "bg-[#E8AF34]" },
  { id: "violet", className: "bg-[#A86FDF]" },
  { id: "sky", className: "bg-[#5591C7]" },
  { id: "mint", className: "bg-[#6DAA45]" },
];

const PROJECT_TYPES: { id: ProjectType; icon: string; label: string }[] = [
  { id: "event", icon: "🎯", label: "Event" },
  { id: "product", icon: "📱", label: "Product" },
  { id: "education", icon: "📚", label: "Education" },
  { id: "publication", icon: "📰", label: "Publication" },
  { id: "hackathon", icon: "⚡", label: "Hackathon" },
  { id: "collaboration", icon: "🤝", label: "Collaboration" },
  { id: "internal_software", icon: "🔧", label: "Internal" },
];

const STATUS_OPTIONS: {
  id: ProjectStatus;
  label: string;
  dot: string;
}[] = [
  { id: "planning", label: "Planning", dot: "bg-outline" },
  { id: "active", label: "Active", dot: "bg-primary" },
  { id: "on_hold", label: "On Hold", dot: "bg-[#E8AF34]" },
  { id: "completed", label: "Completed", dot: "bg-[#6DAA45]" },
];

const PARTNER_ROLES = [
  "co-organizer",
  "sponsor",
  "venue-partner",
] as const;

function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
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

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 py-2"
    >
      {onToggle ? (
        open ? (
          <ChevronDown size={14} className="text-on-surface-variant" />
        ) : (
          <ChevronRight size={14} className="text-on-surface-variant" />
        )
      ) : null}
      <span className="text-section-header text-on-surface-variant">
        {title}
      </span>
    </button>
  );
}

export const ProjectDetailPanel = React.memo(function ProjectDetailPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedNodeType = useCanvasStore((s) => s.selectedNodeType);
  const selectNode = useCanvasStore((s) => s.selectNode);

  const { data: graph } = useOrgGraphData();
  const updateProject = useUpdateProjectMutation();
  const archiveProject = useArchiveProjectMutation();
  const createMilestone = useCreateMilestoneMutation();
  const deleteMilestone = useDeleteMilestoneMutation();
  const createBudget = useCreateBudgetEntryMutation();
  const deleteBudget = useDeleteBudgetEntryMutation();
  const createPartner = useCreateProjectOrgMutation();
  const deletePartner = useDeleteProjectOrgMutation();

  const [healthOpen, setHealthOpen] = useState(true);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    date: "",
    isHardDeadline: true,
    description: "",
  });
  const [budgetForm, setBudgetForm] = useState({
    label: "",
    type: "income" as "income" | "expenditure",
    amount: "",
    confirmed: false,
  });
  const [partnerForm, setPartnerForm] = useState<{
    orgName: string;
    orgRole: string;
  }>({
    orgName: "",
    orgRole: PARTNER_ROLES[0],
  });

  const projectId = useMemo(() => {
    if (!selectedNodeId || selectedNodeType !== "project") return null;
    return selectedNodeId.replace("project-", "");
  }, [selectedNodeId, selectedNodeType]);

  const project: ApiProject | null = useMemo(() => {
    if (!projectId || !graph) return null;
    return graph.projects.find((p) => p.id === projectId) ?? null;
  }, [projectId, graph]);

  const health = projectId ? graph?.projectHealth?.[projectId] : undefined;
  const budget = projectId ? graph?.budgetByProject?.[projectId] : undefined;
  const partners: ApiPartnerOrg[] = projectId
    ? (graph?.partnerOrgsByProject?.[projectId] ?? [])
    : [];
  const milestones = useMemo(() => {
    if (!projectId || !graph?.milestones) return [];
    return [...graph.milestones]
      .filter((m) => m.projectId === projectId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [projectId, graph?.milestones]);

  const phases = useMemo(() => {
    if (!projectId || !graph) return [];
    const taskCountByPhase: Record<string, number> = {};
    for (const t of graph.tasks) {
      if (t.projectId !== projectId) continue;
      taskCountByPhase[t.phaseId] = (taskCountByPhase[t.phaseId] ?? 0) + 1;
    }
    return graph.phases
      .filter((p) => p.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((p) => ({
        ...p,
        taskCount: taskCountByPhase[p.id] ?? 0,
      }));
  }, [projectId, graph]);

  const teamMembers = useMemo(() => {
    if (!projectId || !graph) return [];
    const assigneeIds = new Set<string>();
    for (const t of graph.tasks) {
      if (t.projectId === projectId) {
        for (const id of t.assigneeIds) assigneeIds.add(id);
      }
    }
    return graph.users.filter((u) => assigneeIds.has(u.id));
  }, [projectId, graph]);

  const externalCollaborators = useMemo(() => {
    if (!projectId || !graph?.externalCollaborators) return [];
    return graph.externalCollaborators.filter(
      (c) => c.projectId === projectId || c.projectId === null,
    );
  }, [projectId, graph?.externalCollaborators]);

  const handleClose = useCallback(() => {
    selectNode(null, null);
  }, [selectNode]);

  const patchProject = useCallback(
    (body: Parameters<typeof updateProject.mutate>[0]["body"]) => {
      if (!projectId) return;
      void updateProject.mutate({ projectId, body });
    },
    [projectId, updateProject],
  );

  if (!project || !projectId) return null;

  const completion = project.completionPercent;
  const budgetSummary = budget?.summary;
  const incomeTotal = budgetSummary?.totalIncome ?? 0;
  const expenseTotal = budgetSummary?.totalExpenditure ?? 0;
  const maxBudget = Math.max(incomeTotal, expenseTotal, 1);
  const burnPercent =
    incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0;

  return (
    <div className="flex h-full w-[380px] flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-white/[0.06] p-4">
        <div className="min-w-0 flex-1">
          <p className="text-section-header mb-1 text-on-surface-variant">
            Project identity
          </p>
          <InlineEdit
            value={project.name}
            disabled={updateProject.isPending}
            onSave={(name) => patchProject({ name })}
            className="text-headline-sm font-semibold text-on-surface"
          />
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
        <div className="space-y-4 border-b border-white/[0.06] p-4">
          <div>
            <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
              Accent color
            </p>
            <div className="flex gap-2">
              {ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  disabled={updateProject.isPending}
                  onClick={() => patchProject({ color: swatch.id })}
                  className={[
                    "h-7 w-7 rounded-full border-2",
                    swatch.className,
                    project.color === swatch.id
                      ? "border-white"
                      : "border-transparent opacity-70 hover:opacity-100",
                  ].join(" ")}
                  aria-label={swatch.id}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
              Project type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  disabled={updateProject.isPending}
                  onClick={() => patchProject({ projectType: type.id })}
                  className={[
                    "rounded-full px-2.5 py-1 text-body-sm transition-colors",
                    project.projectType === type.id
                      ? "border border-primary bg-primary/10 text-on-surface"
                      : "border border-white/10 text-on-surface-variant hover:bg-white/5",
                  ].join(" ")}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono-label mb-2 text-[9px] uppercase text-on-surface-variant">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.id}
                  type="button"
                  disabled={updateProject.isPending}
                  onClick={() => patchProject({ status: status.id })}
                  className={[
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-body-sm",
                    project.status === status.id
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-white/10 text-on-surface-variant hover:bg-white/5",
                  ].join(" ")}
                >
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
                Start date
              </span>
              <input
                type="date"
                value={project.startDate ?? ""}
                disabled={updateProject.isPending}
                onChange={(e) =>
                  patchProject({ startDate: e.target.value || null })
                }
                className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 text-on-surface outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono-label text-[9px] uppercase text-on-surface-variant">
                End date
              </span>
              <input
                type="date"
                value={project.endDate ?? ""}
                disabled={updateProject.isPending}
                onChange={(e) =>
                  patchProject({ endDate: e.target.value || null })
                }
                className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 text-on-surface outline-none focus:border-primary"
              />
            </label>
          </div>

          <div>
            <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
              Completion
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, completion)}%` }}
                />
              </div>
              <span className="font-mono-label text-mono-label text-on-surface-variant">
                {Math.round(completion)}%
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-white/[0.06] p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Phases
          </p>
          <ul className="space-y-1.5">
            {phases.map((phase) => (
              <li
                key={phase.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
              >
                <span className="text-body-sm text-on-surface">{phase.name}</span>
                <span className="font-mono-label text-mono-label text-outline">
                  {phase.taskCount} tasks
                </span>
              </li>
            ))}
          </ul>
        </div>

        {teamMembers.length > 0 ? (
          <div className="border-b border-white/[0.06] p-4">
            <p className="text-section-header mb-2 text-on-surface-variant">
              Team on this project
            </p>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-low px-2.5 py-1"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-on-surface">
                    {member.initials}
                  </span>
                  <span className="text-body-sm text-on-surface">
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {externalCollaborators.length > 0 ? (
          <div className="border-b border-white/[0.06] p-4">
            <p className="text-section-header mb-2 text-on-surface-variant">
              External collaborators
            </p>
            <ul className="space-y-1.5">
              {externalCollaborators.map((collab) => (
                <li
                  key={collab.id}
                  className="rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
                >
                  <p className="text-body-sm text-on-surface">{collab.name}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {[collab.organization, collab.role, collab.type]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border-b border-white/[0.06] px-4">
          <SectionHeader
            title="Health overview"
            open={healthOpen}
            onToggle={() => setHealthOpen((v) => !v)}
          />
          {healthOpen && health && (
            <div className="pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={
                        health.grade === "green"
                          ? "#6DAA45"
                          : health.grade === "amber"
                            ? "#E8AF34"
                            : "#DD6974"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${(health.score / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
                    />
                  </svg>
                  <span className="font-mono-label absolute inset-0 flex items-center justify-center text-[8px]">
                    {health.score}
                  </span>
                </div>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-body-sm capitalize",
                    health.grade === "green"
                      ? "bg-[#6DAA45]/10 text-[#6DAA45]"
                      : health.grade === "amber"
                        ? "bg-[#E8AF34]/10 text-[#E8AF34]"
                        : "bg-[#DD6974]/10 text-[#DD6974]",
                  ].join(" ")}
                >
                  {health.grade}
                </span>
              </div>
              <p className="text-body-sm mt-2 text-on-surface-variant">
                {health.blockedCriticalTasks} blocked critical ·{" "}
                {health.overdueTaskCount} overdue
                {health.budgetBurnPercent != null &&
                  ` · Budget burn ${health.budgetBurnPercent}%`}
              </p>
              {health.daysToNextMilestone != null && (
                <p className="text-body-sm mt-1 text-on-surface-variant">
                  Next milestone in {health.daysToNextMilestone} days
                </p>
              )}
            </div>
          )}
        </div>

        {project.isCollaborative && (
          <div className="border-b border-white/[0.06] p-4">
            <p className="text-section-header mb-2 text-on-surface-variant">
              Partner organisations
            </p>
            <div className="space-y-2">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
                >
                  <span className="text-body-sm flex-1 text-on-surface">
                    🤝 {partner.orgName}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-on-surface-variant">
                    {partner.orgRole}
                  </span>
                  <button
                    type="button"
                    disabled={deletePartner.isPending}
                    onClick={() =>
                      void deletePartner.mutate({
                        projectId,
                        partnerId: partner.id,
                      })
                    }
                    className="text-on-surface-variant hover:text-[#DD6974]"
                    aria-label="Remove partner"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {showPartnerForm ? (
              <div className="mt-3 space-y-2 rounded-lg border border-white/10 p-3">
                <input
                  value={partnerForm.orgName}
                  onChange={(e) =>
                    setPartnerForm((f) => ({ ...f, orgName: e.target.value }))
                  }
                  placeholder="Organisation name"
                  className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 text-on-surface outline-none focus:border-primary"
                />
                <select
                  value={partnerForm.orgRole}
                  onChange={(e) =>
                    setPartnerForm((f) => ({ ...f, orgRole: e.target.value }))
                  }
                  className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 text-on-surface outline-none focus:border-primary"
                >
                  {PARTNER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={createPartner.isPending}
                    onClick={() => {
                      void createPartner.mutate(
                        {
                          projectId,
                          orgName: partnerForm.orgName,
                          orgRole: partnerForm.orgRole,
                        },
                        {
                          onSuccess: () => {
                            setPartnerForm({
                              orgName: "",
                              orgRole: PARTNER_ROLES[0],
                            });
                            setShowPartnerForm(false);
                          },
                        },
                      );
                    }}
                    className="text-body-sm flex-1 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary disabled:opacity-50"
                  >
                    {createPartner.isPending ? "Adding…" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPartnerForm(false)}
                    className="text-body-sm flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPartnerForm(true)}
                className="text-body-sm mt-2 text-primary hover:underline"
              >
                + Add partner org
              </button>
            )}
          </div>
        )}

        <div className="border-b border-white/[0.06] p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Milestones
          </p>
          <div className="space-y-1.5">
            {milestones.map((m) => {
              const urgencyClass =
                m.daysUntil < 0 || m.daysUntil <= 7
                  ? "text-[#DD6974]"
                  : m.daysUntil <= 30
                    ? "text-[#E8AF34]"
                    : "text-on-surface";
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-container-low px-2.5 py-2"
                >
                  <button
                    type="button"
                    onClick={() => void focusCanvasNode(`milestone-${m.id}`)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className={`text-body-sm ${urgencyClass}`}>◇</span>
                    <span className="text-body-sm truncate text-on-surface">
                      {m.title}
                    </span>
                    <span className="font-mono-label shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-on-surface-variant">
                      {m.date}
                    </span>
                    {m.isHardDeadline && (
                      <Lock size={10} className="shrink-0 text-on-surface-variant" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMilestone.isPending}
                    onClick={() => void deleteMilestone.mutate(m.id)}
                    className="text-on-surface-variant hover:text-[#DD6974]"
                    aria-label="Delete milestone"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          {showMilestoneForm ? (
            <div className="mt-3 space-y-2 rounded-lg border border-white/10 p-3">
              <input
                value={milestoneForm.title}
                onChange={(e) =>
                  setMilestoneForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Title"
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <input
                type="date"
                value={milestoneForm.date}
                onChange={(e) =>
                  setMilestoneForm((f) => ({ ...f, date: e.target.value }))
                }
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={milestoneForm.isHardDeadline}
                  onChange={(e) =>
                    setMilestoneForm((f) => ({
                      ...f,
                      isHardDeadline: e.target.checked,
                    }))
                  }
                />
                Hard deadline
              </label>
              <textarea
                value={milestoneForm.description}
                onChange={(e) =>
                  setMilestoneForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Description (optional)"
                rows={2}
                className="text-body-sm w-full resize-none rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={createMilestone.isPending}
                  onClick={() => {
                    void createMilestone.mutate(
                      {
                        projectId,
                        body: {
                          title: milestoneForm.title,
                          date: milestoneForm.date,
                          isHardDeadline: milestoneForm.isHardDeadline,
                          description: milestoneForm.description || null,
                        },
                      },
                      {
                        onSuccess: () => {
                          setMilestoneForm({
                            title: "",
                            date: "",
                            isHardDeadline: true,
                            description: "",
                          });
                          setShowMilestoneForm(false);
                        },
                      },
                    );
                  }}
                  className="text-body-sm flex-1 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary disabled:opacity-50"
                >
                  {createMilestone.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="text-body-sm flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMilestoneForm(true)}
              className="text-body-sm mt-2 text-primary hover:underline"
            >
              + Add milestone
            </button>
          )}
        </div>

        <div className="border-b border-white/[0.06] p-4">
          <p className="text-section-header mb-2 text-on-surface-variant">
            Budget
          </p>
          {budgetSummary && (
            <div className="mb-3 rounded-lg border border-white/[0.06] bg-surface-container-low p-3">
              <div className="mb-2 flex justify-between text-body-sm text-on-surface-variant">
                <span>Income {formatLkr(incomeTotal)}</span>
                <span>Expenditure {formatLkr(expenseTotal)}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-[#6DAA45]"
                  style={{ width: `${(incomeTotal / maxBudget) * 100}%` }}
                />
                <div
                  className="bg-[#E8AF34]"
                  style={{ width: `${(expenseTotal / maxBudget) * 100}%` }}
                />
              </div>
              <p className="text-body-sm mt-2 text-on-surface">
                Surplus: {formatLkr(budgetSummary.surplus)}
                {incomeTotal > 0 && (
                  <span className="text-on-surface-variant">
                    {" "}
                    · Burn {burnPercent}%
                  </span>
                )}
              </p>
            </div>
          )}
          {(["income", "expenditure"] as const).map((groupType) => {
            const entries = (budget?.entries ?? []).filter(
              (e) => e.type === groupType,
            );
            if (entries.length === 0) return null;
            return (
              <div key={groupType} className="mb-3">
                <p className="font-mono-label mb-1 text-[9px] uppercase text-on-surface-variant">
                  {groupType === "income" ? "Income" : "Expenditure"}
                </p>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="mb-1 flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2"
                  >
                    <span className="text-body-sm flex-1 text-on-surface">
                      {entry.label}
                    </span>
                    <span className="font-mono-label text-mono-label text-on-surface">
                      {formatLkr(entry.amount)}
                    </span>
                    <span className="text-[9px] text-on-surface-variant">
                      {entry.confirmed ? "confirmed" : "estimated"}
                    </span>
                    <button
                      type="button"
                      disabled={deleteBudget.isPending}
                      onClick={() =>
                        void deleteBudget.mutate({
                          projectId,
                          entryId: entry.id,
                        })
                      }
                      className="text-on-surface-variant hover:text-[#DD6974]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          {showBudgetForm ? (
            <div className="mt-2 space-y-2 rounded-lg border border-white/10 p-3">
              <input
                value={budgetForm.label}
                onChange={(e) =>
                  setBudgetForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Label"
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
                {(["income", "expenditure"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBudgetForm((f) => ({ ...f, type: t }))}
                    className={[
                      "text-body-sm flex-1 rounded-md px-2 py-1 capitalize",
                      budgetForm.type === t
                        ? "bg-primary/10 text-on-surface"
                        : "text-on-surface-variant",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                value={budgetForm.amount}
                onChange={(e) =>
                  setBudgetForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="Amount (LKR)"
                className="text-body-sm w-full rounded-lg border border-white/10 bg-surface-container px-2 py-1.5 outline-none focus:border-primary"
              />
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={budgetForm.confirmed}
                  onChange={(e) =>
                    setBudgetForm((f) => ({
                      ...f,
                      confirmed: e.target.checked,
                    }))
                  }
                />
                Confirmed
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={createBudget.isPending}
                  onClick={() => {
                    const amount = Number(budgetForm.amount.replace(/,/g, ""));
                    if (!budgetForm.label.trim() || !amount) return;
                    void createBudget.mutate(
                      {
                        projectId,
                        body: {
                          label: budgetForm.label.trim(),
                          type: budgetForm.type,
                          amount,
                          confirmed: budgetForm.confirmed,
                        },
                      },
                      {
                        onSuccess: () => {
                          setBudgetForm({
                            label: "",
                            type: "income",
                            amount: "",
                            confirmed: false,
                          });
                          setShowBudgetForm(false);
                        },
                      },
                    );
                  }}
                  className="text-body-sm flex-1 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary disabled:opacity-50"
                >
                  {createBudget.isPending ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="text-body-sm flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBudgetForm(true)}
              className="text-body-sm text-primary hover:underline"
            >
              + Add entry
            </button>
          )}
        </div>

        <div className="p-4">
          <SectionHeader
            title="Danger zone"
            open={dangerOpen}
            onToggle={() => setDangerOpen((v) => !v)}
          />
          {dangerOpen && (
            <div className="rounded-lg border border-[#DD6974]/30 bg-[#DD6974]/5 p-3">
              <p className="text-body-sm mb-3 text-on-surface-variant">
                This will hide the project from the canvas. Tasks are preserved.
              </p>
              {archiveConfirm ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={archiveProject.isPending}
                    onClick={() => {
                      void archiveProject.mutate(projectId, {
                        onSuccess: () => {
                          selectNode(null, null);
                          setArchiveConfirm(false);
                        },
                      });
                    }}
                    className="text-body-sm flex items-center gap-1 rounded-lg border border-[#DD6974]/40 px-3 py-1.5 text-[#DD6974] hover:bg-[#DD6974]/10 disabled:opacity-50"
                  >
                    {archiveProject.isPending && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Confirm archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveConfirm(false)}
                    className="text-body-sm rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setArchiveConfirm(true)}
                  className="text-body-sm text-[#DD6974] underline hover:text-[#DD6974]/80"
                >
                  Archive project
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
