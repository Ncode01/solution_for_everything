import React, { useState } from 'react';
import { PRItem, PRApprovalStatus, PRPublishingStatus, PRPlatform, PRWorkflowStatus, Member } from '../../types';
import { generateId } from '../../lib/dateUtils';
import { getPRWorkflowStatus, syncLegacyFromWorkflow, validateWorkflowTransition } from '../../lib/prWorkflow';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  projectId: string;
  members: Member[];
  initial?: Partial<PRItem>;
  onSave: (item: PRItem) => void;
  onCancel: () => void;
}

const WORKFLOW_STATUSES: PRWorkflowStatus[] = [
  'Draft', 'Sent to Designer', 'Designer Accepted', 'Designing', 'Design Submitted',
  'In Approval', 'Changes Requested', 'Ready to Launch', 'Scheduled', 'Posted', 'Archived',
];
const APPROVAL_STATUSES: PRApprovalStatus[] = ['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'];
const PUBLISH_STATUSES: PRPublishingStatus[] = ['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'];
const PLATFORMS: PRPlatform[] = ['Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

export default function PRItemForm({ projectId, members, initial, onSave, onCancel }: Props) {
  const base: Partial<PRItem> = initial ?? {};
  const [form, setForm] = useState({
    title: base.title ?? '',
    campaign: base.campaign ?? '',
    platform: (base.platform ?? 'Instagram') as PRPlatform,
    publishDate: base.publishDate ?? '',
    publishTime: base.publishTime ?? '18:00',
    designBrief: base.designBrief ?? base.notes ?? '',
    caption: base.caption ?? '',
    notes: base.notes ?? '',
    designer: base.designer ?? '',
    designerId: base.designerId ?? '',
    captionWriter: base.captionWriter ?? '',
    captionWriterId: base.captionWriterId ?? '',
    reviewer: base.reviewer ?? '',
    reviewerId: base.reviewerId ?? '',
    sourceFileLink: base.sourceFileLink ?? '',
    finalDesignLink: base.finalDesignLink ?? base.designLink ?? '',
    workflowStatus: (base.workflowStatus ?? getPRWorkflowStatus(base as PRItem)) as PRWorkflowStatus,
    approvalStatus: (base.approvalStatus ?? 'Draft') as PRApprovalStatus,
    publishingStatus: (base.publishingStatus ?? 'Idea') as PRPublishingStatus,
  });
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const draft: PRItem = {
      id: initial?.id ?? generateId(),
      projectId,
      title: form.title,
      campaign: form.campaign,
      platform: form.platform,
      publishDate: form.publishDate,
      publishTime: form.publishTime,
      designer: form.designer,
      designerId: form.designerId || undefined,
      captionWriter: form.captionWriter,
      captionWriterId: form.captionWriterId || undefined,
      reviewer: form.reviewer,
      reviewerId: form.reviewerId || undefined,
      approvalStatus: form.approvalStatus,
      publishingStatus: form.publishingStatus,
      caption: form.caption,
      designLink: form.finalDesignLink || undefined,
      notes: form.notes || undefined,
      designBrief: form.designBrief,
      sourceFileLink: form.sourceFileLink || undefined,
      finalDesignLink: form.finalDesignLink || undefined,
      workflowStatus: form.workflowStatus,
      designerAcceptedAt: initial?.designerAcceptedAt,
      designSubmittedAt: initial?.designSubmittedAt,
      approvalSubmittedAt: initial?.approvalSubmittedAt,
      approvedAt: initial?.approvedAt,
      postedAt: initial?.postedAt,
      archivedAt: initial?.archivedAt,
    };

    const validationError = validateWorkflowTransition(draft, form.workflowStatus);
    if (validationError) {
      setError(validationError);
      return;
    }

    const synced = syncLegacyFromWorkflow(draft, form.workflowStatus);
    if (form.workflowStatus === 'Posted' && !synced.postedAt) {
      synced.postedAt = new Date().toISOString();
    }
    if (form.workflowStatus === 'Archived' && !synced.archivedAt) {
      synced.archivedAt = new Date().toISOString();
    }
    onSave(synced);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-600/30 bg-red-900/20 p-3 text-xs text-red-300">{error}</div>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Basics</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Registration Launch Poster" />
          </div>
          <div>
            <label className="label">Campaign</label>
            <input className="input" value={form.campaign} onChange={(e) => set('campaign', e.target.value)} />
          </div>
          <div>
            <label className="label">Platform</label>
            <select className="select" value={form.platform} onChange={(e) => set('platform', e.target.value as PRPlatform)}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Publish Date</label>
            <input className="input" type="date" value={form.publishDate} onChange={(e) => set('publishDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Publish Time</label>
            <input className="input" type="time" value={form.publishTime} onChange={(e) => set('publishTime', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Designer brief</div>
        <div>
          <label className="label">Design brief / things to include *</label>
          <textarea
            className="textarea"
            rows={3}
            value={form.designBrief}
            onChange={(e) => set('designBrief', e.target.value)}
            placeholder="Mention theme, speaker, date, venue, logos, colors, sponsor mentions, required text, reference links…"
          />
        </div>
        <div>
          <label className="label">Caption</label>
          <textarea className="textarea" rows={2} value={form.caption} onChange={(e) => set('caption', e.target.value)} />
        </div>
        <div>
          <label className="label">Notes / reference links</label>
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Assignment</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Caption writer</label>
            <MemberSelect members={members} value={form.captionWriterId} onChange={(id, name) => setForm((f) => ({ ...f, captionWriterId: id, captionWriter: name }))} placeholder="Select writer…" />
          </div>
          <div>
            <label className="label">Designer</label>
            <MemberSelect members={members} value={form.designerId} onChange={(id, name) => setForm((f) => ({ ...f, designerId: id, designer: name }))} placeholder="Select designer…" />
          </div>
          <div>
            <label className="label">Reviewer</label>
            <MemberSelect members={members} value={form.reviewerId} onChange={(id, name) => setForm((f) => ({ ...f, reviewerId: id, reviewer: name }))} placeholder="Select reviewer…" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Design output</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">PSD / source file link</label>
            <input className="input" value={form.sourceFileLink} onChange={(e) => set('sourceFileLink', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Final design link</label>
            <input className="input" value={form.finalDesignLink} onChange={(e) => set('finalDesignLink', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Workflow</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Workflow status</label>
            <select className="select" value={form.workflowStatus} onChange={(e) => set('workflowStatus', e.target.value as PRWorkflowStatus)}>
              {WORKFLOW_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Approval status</label>
            <select className="select" value={form.approvalStatus} onChange={(e) => set('approvalStatus', e.target.value as PRApprovalStatus)}>
              {APPROVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Publishing status</label>
            <select className="select" value={form.publishingStatus} onChange={(e) => set('publishingStatus', e.target.value as PRPublishingStatus)}>
              {PUBLISH_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center">
          {initial?.id ? 'Save Changes' : 'Add Launch'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
