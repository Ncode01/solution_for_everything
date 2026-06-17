import React, { useState } from 'react';
import { ApprovalRequest, ApprovalRelatedType, ApprovalStatus, Project, Member } from '../../types';
import { generateId, todayISO } from '../../lib/dateUtils';
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

const RELATED: ApprovalRelatedType[] = ['PR Item', 'Budget', 'Sponsor', 'Task', 'File', 'General'];
const STATUSES: ApprovalStatus[] = ['Draft', 'Submitted', 'Changes Requested', 'Approved', 'Rejected'];

export default function ApprovalForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    projectId: lockedProjectId ?? initial?.projectId ?? '',
    relatedType: (initial?.relatedType ?? 'General') as ApprovalRelatedType,
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

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
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
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required className="col-span-2">
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Registration Poster Approval" />
        </Field>
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            <option value="">No project (general)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Related To">
          <select className="select" value={form.relatedType} onChange={(e) => set('relatedType', e.target.value as ApprovalRelatedType)}>
            {RELATED.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Requested By">
          <MemberSelect
            members={members}
            value={form.requestedById}
            onChange={(id, name) => setForm((f) => ({ ...f, requestedById: id, requestedBy: name }))}
            placeholder="Select member…"
          />
        </Field>
        <Field label="Approver">
          <MemberSelect
            members={members}
            value={form.approverId}
            onChange={(id, name) => setForm((f) => ({ ...f, approverId: id, approver: name }))}
            placeholder="Select approver…"
          />
        </Field>
        <Field label="Status">
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as ApprovalStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Submitted Date">
          <input className="input" type="date" value={form.submittedDate} onChange={(e) => set('submittedDate', e.target.value)} />
        </Field>
        <Field label="Description" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Comments" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.comments} onChange={(e) => set('comments', e.target.value)} placeholder="Approver feedback / notes" />
        </Field>
      </div>
      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Request'} onCancel={onCancel} />
    </form>
  );
}
