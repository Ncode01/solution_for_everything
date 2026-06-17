import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, Phase, Milestone, Member } from '../../types';
import { generateId } from '../../lib/dateUtils';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  projectId: string;
  phases: Phase[];
  milestones: Milestone[];
  members: Member[];
  initial?: Partial<Task>;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const STATUSES: TaskStatus[] = ['To Do', 'Doing', 'Waiting', 'Review', 'Approved', 'Done', 'Blocked'];
const PRIORITIES: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

export default function TaskForm({ projectId, phases, milestones, members, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    assignee: initial?.assignee ?? '',
    assigneeId: initial?.assigneeId ?? '',
    reviewer: initial?.reviewer ?? '',
    reviewerId: initial?.reviewerId ?? '',
    dueDate: initial?.dueDate ?? '',
    priority: (initial?.priority ?? 'Medium') as TaskPriority,
    status: (initial?.status ?? 'To Do') as TaskStatus,
    phaseId: initial?.phaseId ?? '',
    milestoneId: initial?.milestoneId ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      projectId,
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      ...form,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Task Title *</label>
        <input
          className="input"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="What needs to be done?"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="More details..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Assignee *</label>
          <MemberSelect
            members={members}
            value={form.assigneeId}
            onChange={(id, name) => setForm((f) => ({ ...f, assigneeId: id, assignee: name }))}
            placeholder="Select assignee…"
            allowClear={false}
          />
        </div>
        <div>
          <label className="label">Reviewer (optional)</label>
          <MemberSelect
            members={members}
            value={form.reviewerId}
            onChange={(id, name) => setForm((f) => ({ ...f, reviewerId: id, reviewer: name }))}
            placeholder="Select reviewer…"
          />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            className="select"
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="select"
            value={form.status}
            onChange={(e) => set('status', e.target.value as TaskStatus)}
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
        {milestones.length > 0 && (
          <div>
            <label className="label">Milestone (optional)</label>
            <select
              className="select"
              value={form.milestoneId}
              onChange={(e) => set('milestoneId', e.target.value)}
            >
              <option value="">No Milestone</option>
              {milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center">
          {initial?.id ? 'Save Changes' : 'Add Task'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
