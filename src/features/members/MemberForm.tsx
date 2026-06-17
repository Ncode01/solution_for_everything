import React, { useState } from 'react';
import { Member, Committee, AvailabilityStatus, WorkloadLevel, Project } from '../../types';
import { generateId } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';

interface Props {
  initial?: Member;
  projects: Project[];
  onSave: (m: Member) => void;
  onCancel: () => void;
}

const COMMITTEES: Committee[] = [
  'Executive', 'PR & Media', 'Development', 'Sponsorship', 'Finance',
  'Logistics', 'Events', 'Editorial', 'Education', 'General',
];
const AVAILABILITY: AvailabilityStatus[] = ['Available', 'Busy', 'Away', 'Unavailable'];
const WORKLOAD: WorkloadLevel[] = ['Light', 'Normal', 'Heavy', 'Overloaded'];

export default function MemberForm({ initial, projects, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    displayName: initial?.displayName ?? '',
    role: initial?.role ?? '',
    committee: initial?.committee ?? 'General' as Committee,
    gradeOrClass: initial?.gradeOrClass ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    skills: (initial?.skills ?? []).join(', '),
    availabilityStatus: initial?.availabilityStatus ?? 'Available' as AvailabilityStatus,
    workloadLevel: initial?.workloadLevel ?? 'Normal' as WorkloadLevel,
    activeProjectIds: initial?.activeProjectIds ?? [],
    notes: initial?.notes ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleProject(id: string) {
    setForm((f) => ({
      ...f,
      activeProjectIds: f.activeProjectIds.includes(id)
        ? f.activeProjectIds.filter((x) => x !== id)
        : [...f.activeProjectIds, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      name: form.name,
      displayName: form.displayName || form.name.split(' ')[0],
      role: form.role,
      committee: form.committee,
      gradeOrClass: form.gradeOrClass,
      email: form.email || undefined,
      phone: form.phone || undefined,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      availabilityStatus: form.availabilityStatus,
      workloadLevel: form.workloadLevel,
      activeProjectIds: form.activeProjectIds,
      notes: form.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name" required className="col-span-2">
          <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nadula Nisith" />
        </Field>
        <Field label="Display Name">
          <input className="input" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="e.g. Nadula" />
        </Field>
        <Field label="Role">
          <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Secretary" />
        </Field>
        <Field label="Committee">
          <select className="select" value={form.committee} onChange={(e) => set('committee', e.target.value as Committee)}>
            {COMMITTEES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Grade / Class">
          <input className="input" value={form.gradeOrClass} onChange={(e) => set('gradeOrClass', e.target.value)} placeholder="e.g. Grade 12" />
        </Field>
        <Field label="Availability">
          <select className="select" value={form.availabilityStatus} onChange={(e) => set('availabilityStatus', e.target.value as AvailabilityStatus)}>
            {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Workload">
          <select className="select" value={form.workloadLevel} onChange={(e) => set('workloadLevel', e.target.value as WorkloadLevel)}>
            {WORKLOAD.map((w) => <option key={w}>{w}</option>)}
          </select>
        </Field>
        <Field label="Email (optional)">
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone (optional)">
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Skills (comma separated)" className="col-span-2">
          <input className="input" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="e.g. Design, Copywriting, Logistics" />
        </Field>
        <Field label="Active Projects" className="col-span-2">
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProject(p.id)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  form.activeProjectIds.includes(p.id)
                    ? 'bg-blue-600/20 border-blue-600/40 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Notes (optional)" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Member'} onCancel={onCancel} />
    </form>
  );
}
