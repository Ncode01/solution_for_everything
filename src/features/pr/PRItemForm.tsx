import React, { useState } from 'react';
import { PRItem, PRApprovalStatus, PRPublishingStatus, PRPlatform, Member } from '../../types';
import { generateId } from '../../lib/dateUtils';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  projectId: string;
  members: Member[];
  initial?: Partial<PRItem>;
  onSave: (item: PRItem) => void;
  onCancel: () => void;
}

const APPROVAL_STATUSES: PRApprovalStatus[] = ['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'];
const PUBLISH_STATUSES: PRPublishingStatus[] = ['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'];
const PLATFORMS: PRPlatform[] = ['Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

export default function PRItemForm({ projectId, members, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    campaign: initial?.campaign ?? '',
    platform: (initial?.platform ?? 'Instagram') as PRPlatform,
    publishDate: initial?.publishDate ?? '',
    publishTime: initial?.publishTime ?? '18:00',
    designer: initial?.designer ?? '',
    designerId: initial?.designerId ?? '',
    captionWriter: initial?.captionWriter ?? '',
    captionWriterId: initial?.captionWriterId ?? '',
    reviewer: initial?.reviewer ?? '',
    reviewerId: initial?.reviewerId ?? '',
    approvalStatus: (initial?.approvalStatus ?? 'Draft') as PRApprovalStatus,
    publishingStatus: (initial?.publishingStatus ?? 'Idea') as PRPublishingStatus,
    caption: initial?.caption ?? '',
    designLink: initial?.designLink ?? '',
    notes: initial?.notes ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id: initial?.id ?? generateId(), projectId, ...form });
  }

  const missingCaption = form.publishingStatus !== 'Idea' && !form.caption.trim();
  const missingDesignLink = (form.publishingStatus === 'Scheduled' || form.publishingStatus === 'Posted') && !form.designLink.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(missingCaption || missingDesignLink) && (
        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 text-xs text-amber-300 space-y-1">
          {missingCaption && <p>⚠ Caption is missing — required before scheduling.</p>}
          {missingDesignLink && <p>⚠ Design link is missing for scheduled/posted status.</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-2">
          <label className="label">Post Title *</label>
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Registration Launch Poster" />
        </div>
        <div>
          <label className="label">Campaign</label>
          <input className="input" value={form.campaign} onChange={(e) => set('campaign', e.target.value)} placeholder="e.g. BTUI 2026 Launch Campaign" />
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
        <div>
          <label className="label">Designer</label>
          <MemberSelect
            members={members}
            value={form.designerId}
            onChange={(id, name) => setForm((f) => ({ ...f, designerId: id, designer: name }))}
            placeholder="Select designer…"
          />
        </div>
        <div>
          <label className="label">Caption Writer</label>
          <MemberSelect
            members={members}
            value={form.captionWriterId}
            onChange={(id, name) => setForm((f) => ({ ...f, captionWriterId: id, captionWriter: name }))}
            placeholder="Select writer…"
          />
        </div>
        <div>
          <label className="label">Reviewer</label>
          <MemberSelect
            members={members}
            value={form.reviewerId}
            onChange={(id, name) => setForm((f) => ({ ...f, reviewerId: id, reviewer: name }))}
            placeholder="Select reviewer…"
          />
        </div>
        <div>
          <label className="label">Approval Status</label>
          <select className="select" value={form.approvalStatus} onChange={(e) => set('approvalStatus', e.target.value as PRApprovalStatus)}>
            {APPROVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Publishing Status</label>
          <select className="select" value={form.publishingStatus} onChange={(e) => set('publishingStatus', e.target.value as PRPublishingStatus)}>
            {PUBLISH_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Caption</label>
          <textarea className="textarea" rows={3} value={form.caption} onChange={(e) => set('caption', e.target.value)} placeholder="Post caption..." />
        </div>
        <div className="col-span-2">
          <label className="label">Design Link (Canva/Figma)</label>
          <input className="input" value={form.designLink} onChange={(e) => set('designLink', e.target.value)} placeholder="https://..." />
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center">
          {initial?.id ? 'Save Changes' : 'Add PR Item'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
