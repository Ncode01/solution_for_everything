import React, { useState } from 'react';
import { ApprovalRequest, ApprovalRelatedType, ApprovalStage, ApprovalStageStatus, ApprovalStatus, Project, Member } from '../../types';
import { generateId, todayISO } from '../../lib/dateUtils';
import {
  computeApprovalStatus,
  deriveApprovalFromStages,
  getApprovalTypeOptions,
  getStageTemplates,
} from '../../lib/approvalStages';
import { Field, FormActions } from '../../components/Field';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  initial?: ApprovalRequest;
  projects: Project[];
  members: Member[];
  lockedProjectId?: string;
  onSave: (a: ApprovalRequest) => void;
  onCancel: () => void;
}

const STAGE_STATUSES: ApprovalStageStatus[] = ['Not Started', 'Pending', 'Approved', 'Changes Requested', 'Rejected', 'Skipped'];

export default function ApprovalForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [stagesEdited, setStagesEdited] = useState(!!initial?.stages?.length);
  const [form, setForm] = useState({
    projectId: lockedProjectId ?? initial?.projectId ?? '',
    relatedType: (initial?.relatedType ?? 'General Approval') as ApprovalRelatedType,
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    requestedBy: initial?.requestedBy ?? '',
    requestedById: initial?.requestedById ?? '',
    approver: initial?.approver ?? '',
    approverId: initial?.approverId ?? '',
    status: (initial?.status ?? 'Draft') as ApprovalStatus,
    submittedDate: initial?.submittedDate ?? todayISO(),
    decisionDate: initial?.decisionDate ?? '',
    comments: initial?.comments ?? '',
  });
  const [stages, setStages] = useState<ApprovalStage[]>(
    initial?.stages?.length
      ? [...initial.stages].sort((a, b) => a.sortOrder - b.sortOrder)
      : getStageTemplates((initial?.relatedType ?? 'General Approval') as ApprovalRelatedType),
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTypeChange(type: ApprovalRelatedType) {
    set('relatedType', type);
    if (!stagesEdited && !initial?.id) {
      setStages(getStageTemplates(type));
    }
  }

  function updateStage(stageId: string, patch: Partial<ApprovalStage>) {
    setStagesEdited(true);
    setStages((prev) => prev.map((s) => s.id === stageId ? { ...s, ...patch } : s));
  }

  function addStage() {
    setStagesEdited(true);
    const maxOrder = stages.reduce((m, s) => Math.max(m, s.sortOrder), 0);
    setStages([...stages, { id: generateId(), title: 'Custom stage', sortOrder: maxOrder + 1, status: 'Not Started' }]);
  }

  function deleteStage(stageId: string) {
    setStagesEdited(true);
    setStages((prev) => prev.filter((s) => s.id !== stageId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base: ApprovalRequest = {
      id: initial?.id ?? generateId(),
      projectId: form.projectId || undefined,
      relatedType: form.relatedType,
      relatedId: initial?.relatedId,
      title: form.title,
      description: form.description,
      requestedBy: form.requestedBy,
      requestedById: form.requestedById || undefined,
      approver: form.approver,
      approverId: form.approverId || undefined,
      status: form.status,
      submittedDate: form.submittedDate,
      decisionDate: form.decisionDate || undefined,
      comments: form.comments || undefined,
      stages,
    };
    const derived = deriveApprovalFromStages(base, stages);
    onSave(derived);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required className="col-span-2">
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. BTUI Project Authorization" />
        </Field>
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            <option value="">No project (general)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Approval Type">
          <select className="select" value={form.relatedType} onChange={(e) => handleTypeChange(e.target.value as ApprovalRelatedType)}>
            {getApprovalTypeOptions().map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Requested By">
          <MemberSelect members={members} value={form.requestedById} onChange={(id, name) => setForm((f) => ({ ...f, requestedById: id, requestedBy: name }))} placeholder="Select member…" />
        </Field>
        <Field label="Overall Owner / Approver">
          <MemberSelect members={members} value={form.approverId} onChange={(id, name) => setForm((f) => ({ ...f, approverId: id, approver: name }))} placeholder="Select approver…" />
        </Field>
        <Field label="Submitted Date">
          <input className="input" type="date" value={form.submittedDate} onChange={(e) => set('submittedDate', e.target.value)} />
        </Field>
        <Field label="Overall status (derived)" hint={`Computed: ${computeApprovalStatus(stages)}`}>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as ApprovalStatus)}>
            {(['Draft', 'Submitted', 'Changes Requested', 'Approved', 'Rejected'] as ApprovalStatus[]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Description" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Stages</div>
          <button type="button" className="btn-secondary text-xs" onClick={addStage}>Add Stage</button>
        </div>
        <div className="space-y-2">
          {stages.sort((a, b) => a.sortOrder - b.sortOrder).map((stage) => (
            <div key={stage.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_100px_auto] gap-2 rounded-lg border border-[var(--border-subtle)] p-2">
              <input className="input text-sm" value={stage.title} onChange={(e) => updateStage(stage.id, { title: e.target.value })} />
              <MemberSelect
                members={members}
                value={stage.ownerId}
                onChange={(id, name) => updateStage(stage.id, { ownerId: id, owner: name })}
                placeholder="Owner…"
              />
              <select className="select text-xs" value={stage.status} onChange={(e) => updateStage(stage.id, { status: e.target.value as ApprovalStageStatus })}>
                {STAGE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="input text-xs" type="date" value={stage.dueDate ?? ''} onChange={(e) => updateStage(stage.id, { dueDate: e.target.value || undefined })} />
              <button type="button" className="btn-ghost text-xs text-[var(--danger)]" onClick={() => deleteStage(stage.id)}>Del</button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Comments" className="col-span-2">
        <textarea className="textarea" rows={2} value={form.comments} onChange={(e) => set('comments', e.target.value)} placeholder="Notes / feedback" />
      </Field>

      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Request'} onCancel={onCancel} />
    </form>
  );
}
