import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Meeting, MeetingType, MeetingDecision, MeetingActionItem,
  ActionItemStatus, Project, Member
} from '../../types';
import { generateId, todayISO } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';
import MemberSelect from '../../components/MemberSelect';
import MultiMemberSelect from '../../components/MultiMemberSelect';

interface Props {
  initial?: Meeting;
  projects: Project[];
  members: Member[];
  lockedProjectId?: string;
  onSave: (m: Meeting) => void;
  onCancel: () => void;
}

const TYPES: MeetingType[] = [
  'Executive Meeting', 'Project Meeting', 'PR Meeting', 'Sponsorship Meeting',
  'Logistics Meeting', 'Teacher Approval Meeting', 'Post-Project Review',
];
const ACTION_STATUSES: ActionItemStatus[] = ['Open', 'In Progress', 'Done', 'Cancelled'];

export default function MeetingForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    type: (initial?.type ?? 'Project Meeting') as MeetingType,
    projectId: lockedProjectId ?? initial?.projectId ?? '',
    date: initial?.date ?? todayISO(),
    time: initial?.time ?? '16:00',
    location: initial?.location ?? '',
    agenda: initial?.agenda ?? '',
    notes: initial?.notes ?? '',
    nextMeetingDate: initial?.nextMeetingDate ?? '',
  });

  // Attendees stored as member IDs (preferring attendeeIds, falling back to legacy attendees)
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    initial?.attendeeIds ?? []
  );
  const [decisions, setDecisions] = useState<MeetingDecision[]>(initial?.decisions ?? []);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(initial?.actionItems ?? []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Build legacy attendees list from selected member names (backward compat)
    const attendeeNames = attendeeIds
      .map((id) => members.find((m) => m.id === id)?.displayName ?? id)
      .filter(Boolean);
    onSave({
      id: initial?.id ?? generateId(),
      title: form.title,
      type: form.type,
      projectId: form.projectId || undefined,
      date: form.date,
      time: form.time,
      location: form.location || undefined,
      attendees: attendeeNames,
      attendeeIds,
      agenda: form.agenda,
      notes: form.notes,
      decisions: decisions.filter((d) => d.decision.trim()),
      actionItems: actionItems.filter((a) => a.title.trim()),
      nextMeetingDate: form.nextMeetingDate || undefined,
      createdAt: initial?.createdAt ?? todayISO(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required className="col-span-2">
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. BTUI Project Planning Meeting" />
        </Field>
        <Field label="Type">
          <select className="select" value={form.type} onChange={(e) => set('type', e.target.value as MeetingType)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            <option value="">No project (general)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Time">
          <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
        </Field>
        <Field label="Location">
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. RCCS Room / Online" />
        </Field>
        <Field label="Next Meeting Date">
          <input className="input" type="date" value={form.nextMeetingDate} onChange={(e) => set('nextMeetingDate', e.target.value)} />
        </Field>
        <Field label="Attendees" className="col-span-2">
          <MultiMemberSelect
            members={members}
            value={attendeeIds}
            onChange={setAttendeeIds}
            placeholder="Select attendees…"
          />
        </Field>
        <Field label="Agenda" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.agenda} onChange={(e) => set('agenda', e.target.value)} />
        </Field>
        <Field label="Notes / Minutes" className="col-span-2">
          <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>

      {/* Decisions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Decisions</label>
          <button
            type="button"
            className="btn-ghost text-xs px-2 py-1"
            onClick={() => setDecisions((d) => [...d, { id: generateId(), decision: '', owner: '', date: form.date }])}
          >
            <Plus size={13} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {decisions.map((d, i) => (
            <div key={d.id} className="flex gap-2 flex-wrap">
              <input
                className="input flex-1 min-w-40"
                placeholder="Decision text"
                value={d.decision}
                onChange={(e) => setDecisions((arr) => arr.map((x, idx) => idx === i ? { ...x, decision: e.target.value } : x))}
              />
              <div className="w-44">
                <MemberSelect
                  members={members}
                  value={d.ownerId}
                  onChange={(id, name) => setDecisions((arr) => arr.map((x, idx) => idx === i ? { ...x, ownerId: id, owner: name } : x))}
                  placeholder="Owner…"
                />
              </div>
              <button type="button" className="btn-ghost p-2 text-red-500" onClick={() => setDecisions((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {decisions.length === 0 && <p className="text-xs text-slate-600">No decisions recorded.</p>}
        </div>
      </div>

      {/* Action items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Action Items</label>
          <button
            type="button"
            className="btn-ghost text-xs px-2 py-1"
            onClick={() => setActionItems((a) => [...a, { id: generateId(), title: '', owner: '', ownerId: '', dueDate: '', status: 'Open' }])}
          >
            <Plus size={13} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {actionItems.map((a, i) => (
            <div key={a.id} className="flex gap-2 flex-wrap">
              <input
                className="input flex-1 min-w-40"
                placeholder="Action item"
                value={a.title}
                onChange={(e) => setActionItems((arr) => arr.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
              />
              <div className="w-44">
                <MemberSelect
                  members={members}
                  value={a.ownerId}
                  onChange={(id, name) => setActionItems((arr) => arr.map((x, idx) => idx === i ? { ...x, ownerId: id, owner: name } : x))}
                  placeholder="Owner…"
                />
              </div>
              <input
                className="input w-36"
                type="date"
                value={a.dueDate}
                onChange={(e) => setActionItems((arr) => arr.map((x, idx) => idx === i ? { ...x, dueDate: e.target.value } : x))}
              />
              <select
                className="select w-32"
                value={a.status}
                onChange={(e) => setActionItems((arr) => arr.map((x, idx) => idx === i ? { ...x, status: e.target.value as ActionItemStatus } : x))}
              >
                {ACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button type="button" className="btn-ghost p-2 text-red-500" onClick={() => setActionItems((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {actionItems.length === 0 && <p className="text-xs text-slate-600">No action items yet.</p>}
        </div>
      </div>

      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Meeting'} onCancel={onCancel} />
    </form>
  );
}
