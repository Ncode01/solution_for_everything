import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectPriority, ProjectType } from '../../types';
import { generateId } from '../../lib/dateUtils';

interface Props {
  initial?: Partial<Project>;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

const STATUSES: ProjectStatus[] = ['Idea', 'Planning', 'Active', 'On Hold', 'Event Week', 'Completed', 'Archived'];
const PRIORITIES: ProjectPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const TYPES: ProjectType[] = [
  'ICT Day / Competition / Event',
  'Outreach / Workshop / Network Building',
  'Educational Workshop / Seminar Series',
  'Internal System',
  'Publication',
  'Software Product',
  'Hackathon',
  'Mixed Project',
];

export default function ProjectForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'Mixed Project' as ProjectType,
    status: initial?.status ?? 'Planning' as ProjectStatus,
    priority: initial?.priority ?? 'Medium' as ProjectPriority,
    description: initial?.description ?? '',
    owner: initial?.owner ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    finalEventDate: initial?.finalEventDate ?? '',
    progress: initial?.progress ?? 0,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const project: Project = {
      id: initial?.id ?? generateId(),
      ...form,
      phases: initial?.phases ?? [],
      milestones: initial?.milestones ?? [],
      tasks: initial?.tasks ?? [],
      prItems: initial?.prItems ?? [],
    };
    onSave(project);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Project Name *</label>
          <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Beyond The User Interface 2026" />
        </div>
        <div>
          <label className="label">Type *</label>
          <select className="select" value={form.type} onChange={(e) => set('type', e.target.value as ProjectType)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input" type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="select" value={form.priority} onChange={(e) => set('priority', e.target.value as ProjectPriority)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Owner / Project Head</label>
          <input className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. RCCS Admin" />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="textarea" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of the project..." />
        </div>
        <div>
          <label className="label">Start Date</label>
          <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input className="input" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Final Event Date (optional)</label>
          <input className="input" type="date" value={form.finalEventDate} onChange={(e) => set('finalEventDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Progress (%)</label>
          <input className="input" type="number" min={0} max={100} value={form.progress} onChange={(e) => set('progress', Number(e.target.value))} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1 justify-center">
          {initial?.id ? 'Save Changes' : 'Create Project'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
