import React, { useState } from 'react';
import { Milestone, MilestoneStatus, Phase, Member } from '../../types';
import { generateId } from '../../lib/dateUtils';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  projectId: string;
  phases: Phase[];
  members: Member[];
  initial?: Partial<Milestone>;
  onSave: (m: Milestone) => void;
  onCancel: () => void;
}

const STATUSES: MilestoneStatus[] = [
  'Not Started', 'In Progress', 'Blocked', 'Pending Approval', 'Completed', 'Delayed', 'Cancelled',
];

export default function MilestoneForm({ projectId, phases, members, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    dueDate: initial?.dueDate ?? '',
    owner: initial?.owner ?? '',
    ownerId: initial?.ownerId ?? '',
    status: (initial?.status ?? 'Not Started') as MilestoneStatus,
    phaseId: initial?.phaseId ?? '',
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
        <label className="label">Milestone Name *</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Registration opens"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Due Date *</label>
          <input
            className="input"
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Owner</label>
          <MemberSelect
            members={members}
            value={form.ownerId}
            onChange={(id, name) => setForm((f) => ({ ...f, ownerId: id, owner: name }))}
            placeholder="Select owner…"
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="select"
            value={form.status}
            onChange={(e) => set('status', e.target.value as MilestoneStatus)}
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {phases.length > 0 && (
          <div>
            <label className="label">Phase (optional)</label>
            <select
              className="select"
              value={form.phaseId}
              onChange={(e) => set('phaseId', e.target.value)}
            >
              <option value="">No Phase</option>
              {phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center">
          {initial?.id ? 'Save Changes' : 'Add Milestone'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
