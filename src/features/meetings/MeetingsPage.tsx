import React, { useState } from 'react';
import { Plus, CalendarCheck, Edit2, Trash2, Copy, ListPlus, MapPin, Users } from 'lucide-react';
import { Meeting, MeetingType, MeetingActionItem, Task } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SectionHeader from '../../components/SectionHeader';
import MeetingForm from './MeetingForm';
import { formatDate, isOverdue, generateId, todayISO } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';

const TYPES: MeetingType[] = [
  'Executive Meeting', 'Project Meeting', 'PR Meeting', 'Sponsorship Meeting',
  'Logistics Meeting', 'Teacher Approval Meeting', 'Post-Project Review',
];

export function buildMeetingSummary(m: Meeting, projectName?: string): string {
  const lines: string[] = [];
  lines.push(`${m.title} (${m.type})`);
  lines.push(`Date: ${formatDate(m.date)} ${m.time}${m.location ? ` · ${m.location}` : ''}`);
  if (projectName) lines.push(`Project: ${projectName}`);
  if (m.attendees.length) lines.push(`Attendees: ${m.attendees.join(', ')}`);
  if (m.agenda) lines.push(`\nAgenda:\n${m.agenda}`);
  if (m.notes) lines.push(`\nNotes:\n${m.notes}`);
  if (m.decisions.length) {
    lines.push('\nDecisions:');
    m.decisions.forEach((d) => lines.push(`- ${d.decision}${d.owner ? ` (${d.owner})` : ''}`));
  }
  if (m.actionItems.length) {
    lines.push('\nAction Items:');
    m.actionItems.forEach((a) => lines.push(`- [${a.status}] ${a.title} — ${a.owner || 'Unassigned'}${a.dueDate ? ` (due ${a.dueDate})` : ''}`));
  }
  if (m.nextMeetingDate) lines.push(`\nNext meeting: ${formatDate(m.nextMeetingDate)}`);
  return lines.join('\n');
}

export default function MeetingsPage() {
  const { data, saveMeeting, deleteMeeting, saveProject } = useAppData();
  const { meetings, projects } = data;
  const [typeFilter, setTypeFilter] = useState<MeetingType | 'All'>('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: Meeting }>({ open: false });
  const [detail, setDetail] = useState<Meeting | null>(null);
  const [confirmDel, setConfirmDel] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  useAutoNew(() => setFormModal({ open: true }));

  const filtered = meetings
    .filter((m) => (typeFilter === 'All' || m.type === typeFilter) && (projectFilter === 'All' || m.projectId === projectFilter))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const projectName = (id?: string) => projects.find((p) => p.id === id)?.name;

  // Open / overdue action items across all meetings
  const openActions = meetings.flatMap((m) =>
    m.actionItems
      .filter((a) => a.status !== 'Done' && a.status !== 'Cancelled')
      .map((a) => ({ meeting: m, action: a }))
  );
  const dueSoonActions = [...openActions].sort(
    (x, y) => new Date(x.action.dueDate || '2999').getTime() - new Date(y.action.dueDate || '2999').getTime()
  );

  function toggleActionStatus(meeting: Meeting, action: MeetingActionItem) {
    const next = action.status === 'Done' ? 'Open' : 'Done';
    saveMeeting({
      ...meeting,
      actionItems: meeting.actionItems.map((a) => (a.id === action.id ? { ...a, status: next } : a)),
    });
    if (detail?.id === meeting.id) {
      setDetail({ ...meeting, actionItems: meeting.actionItems.map((a) => (a.id === action.id ? { ...a, status: next } : a)) });
    }
  }

  function convertToTask(meeting: Meeting, action: MeetingActionItem) {
    if (!meeting.projectId) {
      window.alert('Link this meeting to a project first to create a task from an action item.');
      return;
    }
    const project = projects.find((p) => p.id === meeting.projectId);
    if (!project) return;
    const task: Task = {
      id: generateId(),
      projectId: project.id,
      title: action.title,
      description: `From meeting: ${meeting.title}`,
      assignee: action.owner || '',
      dueDate: action.dueDate || '',
      priority: 'Medium',
      status: 'To Do',
      createdAt: todayISO(),
    };
    saveProject({ ...project, tasks: [...project.tasks, task] });
    const updatedMeeting = { ...meeting, actionItems: meeting.actionItems.map((a) => (a.id === action.id ? { ...a, linkedTaskId: task.id } : a)) };
    saveMeeting(updatedMeeting);
    if (detail?.id === meeting.id) setDetail(updatedMeeting);
  }

  function copySummary(m: Meeting) {
    navigator.clipboard?.writeText(buildMeetingSummary(m, projectName(m.projectId))).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Meetings"
        description="Turn meetings into decisions and tracked action items."
        actions={<button onClick={() => setFormModal({ open: true })} className="btn-primary"><Plus size={16} /> New Meeting</button>}
      />

      {dueSoonActions.length > 0 && (
        <Card className="border-amber-900/40">
          <SectionHeader title="Open action items" tone="warning" count={dueSoonActions.length} />
          <div className="space-y-1.5">
            {dueSoonActions.slice(0, 5).map(({ meeting, action }) => (
              <div key={action.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-300 truncate">{action.title}</span>
                <span className={`text-xs shrink-0 ${action.dueDate && isOverdue(action.dueDate) ? 'text-red-400' : 'text-slate-500'}`}>
                  {action.owner || 'Unassigned'}{action.dueDate ? ` · ${formatDate(action.dueDate)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <select className="select w-52" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MeetingType | 'All')}>
          <option value="All">All Types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No meetings" description="Record meetings to keep decisions and action items in one place." action={<button onClick={() => setFormModal({ open: true })} className="btn-primary">Add Meeting</button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((m) => {
            const open = m.actionItems.filter((a) => a.status !== 'Done' && a.status !== 'Cancelled').length;
            return (
              <Card key={m.id} onClick={() => setDetail(m)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{m.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(m.date)} · {m.time}</p>
                  </div>
                  <StatusBadge status={m.type === 'Project Meeting' ? 'In Progress' : 'Submitted'} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.type}{projectName(m.projectId) ? ` · ${projectName(m.projectId)}` : ''}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-2">
                  <span>{m.decisions.length} decisions</span>
                  <span className={open > 0 ? 'text-amber-400' : ''}>{open} open actions</span>
                  {m.attendees.length > 0 && <span className="flex items-center gap-1"><Users size={11} /> {m.attendees.length}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit Meeting' : 'New Meeting'} size="lg">
        <MeetingForm
          initial={formModal.editing}
          projects={projects}
          members={data.members}
          onSave={(m) => { saveMeeting(m); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ''} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span>{detail.type}</span>
              <span>{formatDate(detail.date)} · {detail.time}</span>
              {detail.location && <span className="flex items-center gap-1"><MapPin size={11} /> {detail.location}</span>}
              {projectName(detail.projectId) && <span className="text-blue-400">{projectName(detail.projectId)}</span>}
            </div>
            {detail.attendees.length > 0 && (
              <p className="text-sm text-slate-300"><span className="text-slate-500">Attendees: </span>{detail.attendees.join(', ')}</p>
            )}
            {detail.agenda && <div><p className="text-xs text-slate-500 mb-1">Agenda</p><p className="text-sm text-slate-300 whitespace-pre-line">{detail.agenda}</p></div>}
            {detail.notes && <div><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-300 whitespace-pre-line">{detail.notes}</p></div>}

            {detail.decisions.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Decisions</p>
                <ul className="space-y-1.5">
                  {detail.decisions.map((d) => (
                    <li key={d.id} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span>{d.decision}{d.owner ? <span className="text-slate-500"> — {d.owner}</span> : null}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-1.5">Action Items</p>
              <div className="space-y-2">
                {detail.actionItems.length === 0 && <p className="text-sm text-slate-600">No action items.</p>}
                {detail.actionItems.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    <input type="checkbox" checked={a.status === 'Done'} onChange={() => toggleActionStatus(detail, a)} className="accent-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${a.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{a.title}</p>
                      <p className="text-xs text-slate-500">{a.owner || 'Unassigned'}{a.dueDate ? ` · due ${formatDate(a.dueDate)}` : ''}</p>
                    </div>
                    {a.linkedTaskId ? (
                      <span className="text-xs text-emerald-400 shrink-0">Task created</span>
                    ) : (
                      <button className="btn-ghost text-xs px-2 py-1 shrink-0" onClick={() => convertToTask(detail, a)} title="Create task">
                        <ListPlus size={13} /> Task
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-800 pt-3 flex-wrap">
              <button className="btn-ghost" onClick={() => copySummary(detail)}><Copy size={14} /> {copied ? 'Copied!' : 'Copy Summary'}</button>
              <button className="btn-secondary" onClick={() => { setFormModal({ open: true, editing: detail }); setDetail(null); }}><Edit2 size={14} /> Edit</button>
              <button className="btn-danger" onClick={() => { setConfirmDel(detail); setDetail(null); }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete meeting?"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteMeeting(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
