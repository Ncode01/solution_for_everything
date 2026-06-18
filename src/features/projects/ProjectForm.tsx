import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectPriority, ProjectType } from '../../types';
import { generateId } from '../../lib/dateUtils';
import { PROJECT_TEMPLATES, ProjectTemplateId } from '../../lib/projectTemplates';
import MemberSelect from '../../components/MemberSelect';
import { Member } from '../../types';

interface Props {
  initial?: Partial<Project>;
  members?: Member[];
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

export default function ProjectForm({ initial, members = [], onSave, onCancel }: Props) {
  const isEdit = !!initial?.id;
  const [templateId, setTemplateId] = useState<ProjectTemplateId>('blank');
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'Mixed Project' as ProjectType,
    status: initial?.status ?? 'Planning' as ProjectStatus,
    priority: initial?.priority ?? 'Medium' as ProjectPriority,
    description: initial?.description ?? '',
    owner: initial?.owner ?? '',
    ownerId: initial?.ownerId ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    finalEventDate: initial?.finalEventDate ?? '',
    progress: initial?.progress ?? 0,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTemplateChange(id: ProjectTemplateId) {
    setTemplateId(id);
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === id);
    if (tpl && !isEdit) {
      set('type', tpl.projectType);
      set('status', tpl.suggestedStatus);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const project: Project = {
      id: initial?.id ?? generateId(),
      name: form.name,
      type: form.type,
      status: form.status,
      priority: form.priority,
      description: form.description,
      owner: form.owner,
      ownerId: form.ownerId || undefined,
      year: form.year,
      startDate: form.startDate,
      endDate: form.endDate,
      finalEventDate: form.finalEventDate || undefined,
      progress: form.progress,
      phases: initial?.phases ?? [],
      milestones: initial?.milestones ?? [],
      tasks: initial?.tasks ?? [],
      prItems: initial?.prItems ?? [],
      _templateId: !isEdit ? templateId : undefined,
    } as Project & { _templateId?: ProjectTemplateId };
    onSave(project);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div>
          <label className="label">Project Template</label>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {PROJECT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onTemplateChange(tpl.id)}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  templateId === tpl.id
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <p className="text-sm font-medium text-white">{tpl.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
          {members.length > 0 ? (
            <MemberSelect
              members={members}
              value={form.ownerId || form.owner}
              onChange={(id, name) => { set('ownerId', id); set('owner', name); }}
              placeholder="Select project owner…"
            />
          ) : (
            <input className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. RCCS Admin" />
          )}
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
          {initial?.id ? 'Save Changes' : templateId === 'blank' ? 'Create Project' : 'Create from Template'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
