import React, { useState } from 'react';
import { FileLink, FileCategory, FileStatus, Member } from '../../types';
import { generateId, todayISO } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  projectId: string;
  members: Member[];
  initial?: FileLink;
  onSave: (f: FileLink) => void;
  onCancel: () => void;
}

const CATEGORIES: FileCategory[] = [
  'Project Proposal', 'Budget', 'PR', 'Sponsorship', 'Meeting Notes', 'Invitations',
  'Certificates', 'Designs', 'Videos', 'Event Agenda', 'Final Report', 'Receipts', 'Other',
];
const STATUSES: FileStatus[] = ['Draft', 'Final', 'Approved', 'Archived'];

export default function FileLinkForm({ projectId, members, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: (initial?.category ?? 'Other') as FileCategory,
    url: initial?.url ?? '',
    owner: initial?.owner ?? '',
    ownerId: initial?.ownerId ?? '',
    status: (initial?.status ?? 'Draft') as FileStatus,
    notes: initial?.notes ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      projectId,
      title: form.title,
      category: form.category,
      url: form.url,
      owner: form.owner,
      ownerId: form.ownerId || undefined,
      status: form.status,
      notes: form.notes || undefined,
      createdAt: initial?.createdAt ?? todayISO(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required className="col-span-2">
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. BTUI Budget Sheet" />
        </Field>
        <Field label="URL" required className="col-span-2" hint="External link only (Google Drive, Canva, Docs...).">
          <input className="input" required type="url" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Category">
          <select className="select" value={form.category} onChange={(e) => set('category', e.target.value as FileCategory)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as FileStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Owner" className="col-span-2">
          <MemberSelect
            members={members}
            value={form.ownerId}
            onChange={(id, name) => setForm((f) => ({ ...f, ownerId: id, owner: name }))}
            placeholder="Select owner…"
          />
        </Field>
        <Field label="Notes" className="col-span-2">
          <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
      <FormActions submitLabel={initial ? 'Save Changes' : 'Add File Link'} onCancel={onCancel} />
    </form>
  );
}
