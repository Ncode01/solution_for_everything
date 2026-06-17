import React, { useState } from 'react';
import { Phase, PhaseStatus } from '../../types';
import { generateId } from '../../lib/dateUtils';

interface Props {
  projectId: string;
  initial?: Partial<Phase>;
  onSave: (phase: Phase) => void;
  onCancel: () => void;
}

const STATUSES: PhaseStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

export default function PhaseForm({ projectId, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    owner: initial?.owner ?? '',
    status: initial?.status ?? 'Not Started' as PhaseStatus,
    progress: initial?.progress ?? 0,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id: initial?.id ?? generateId(), projectId, ...form });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Phase Name *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Phase 1: Online Competitions" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="textarea" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start Date</label>
          <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input className="input" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Owner</label>
          <input className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as PhaseStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Progress (%)</label>
          <input className="input" type="number" min={0} max={100} value={form.progress} onChange={(e) => set('progress', Number(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center">{initial?.id ? 'Save Changes' : 'Add Phase'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
