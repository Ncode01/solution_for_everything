/**
 * EventDayPage — RCCS-specific event-day management (Phase Six).
 * Accessible at /event-day or from Project Overview → "Start Event-Day Mode".
 */
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PartyPopper, Plus, AlertTriangle, CheckCircle2, Clock, Copy,
  Printer, Edit2, Trash2, User, Filter,
} from 'lucide-react';
import {
  EventDayItem, EventDayItemStatus, EventDayItemCategory,
  EventDayItemPriority,
} from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import MemberSelect from '../../components/MemberSelect';
import { generateId, todayISO } from '../../lib/dateUtils';

const STATUSES: EventDayItemStatus[] = ['Not Ready', 'Ready', 'In Progress', 'Completed', 'Problem'];
const CATEGORIES: EventDayItemCategory[] = ['Agenda', 'Guest', 'Registration', 'AV', 'Certificates', 'Refreshments', 'Stage', 'Media', 'Logistics', 'Emergency', 'Other'];
const PRIORITIES: EventDayItemPriority[] = ['Normal', 'High', 'Critical'];

const STATUS_COLORS: Record<EventDayItemStatus, string> = {
  'Not Ready':  'bg-slate-700 text-slate-300',
  'Ready':      'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40',
  'In Progress':'bg-blue-900/60 text-blue-300 border border-blue-700/40',
  'Completed':  'bg-emerald-800/80 text-emerald-200 border border-emerald-600/50',
  'Problem':    'bg-red-900/80 text-red-200 border border-red-700/60',
};

const STATUS_BORDER: Record<EventDayItemStatus, string> = {
  'Not Ready':  'border-l-slate-600',
  'Ready':      'border-l-emerald-500',
  'In Progress':'border-l-blue-500',
  'Completed':  'border-l-emerald-400',
  'Problem':    'border-l-red-500',
};

const PRIORITY_COLOR: Record<EventDayItemPriority, string> = {
  Normal:  '',
  High:    'text-amber-400',
  Critical:'text-red-400 font-semibold',
};

interface ItemFormData {
  title: string;
  category: EventDayItemCategory;
  ownerId: string;
  scheduledTime: string;
  status: EventDayItemStatus;
  priority: EventDayItemPriority;
  notes: string;
}

function defaultForm(): ItemFormData {
  return { title: '', category: 'Logistics', ownerId: '', scheduledTime: '', status: 'Not Ready', priority: 'Normal', notes: '' };
}

export default function EventDayPage() {
  const [params] = useSearchParams();
  const { data, saveEventDayItem, deleteEventDayItem } = useAppData();
  const { projects, members, eventDayItems = [] } = data;

  const [selectedProjectId, setSelectedProjectId] = useState(params.get('project') ?? projects.find((p) => p.status === 'Active' || p.status === 'Event Week')?.id ?? projects[0]?.id ?? '');
  const [categoryFilter, setCategoryFilter] = useState<EventDayItemCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<EventDayItemStatus | 'All'>('All');
  const [modal, setModal] = useState<{ open: boolean; editing?: EventDayItem }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<EventDayItem | null>(null);
  const [form, setForm] = useState<ItemFormData>(defaultForm());
  const [copied, setCopied] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const items = eventDayItems.filter((i) => i.projectId === selectedProjectId);

  const filtered = items.filter((i) => {
    const matchCat = categoryFilter === 'All' || i.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchCat && matchStatus;
  }).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''));

  const problems = items.filter((i) => i.status === 'Problem');
  const notReady = items.filter((i) => i.status === 'Not Ready' || i.status === 'In Progress');
  const completed = items.filter((i) => i.status === 'Completed');
  const readinessPercent = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;
  const nowItems = items.filter((i) => i.status === 'In Progress' || i.status === 'Problem');
  const nextItems = items.filter((i) => i.status !== 'Completed' && i.status !== 'Problem').slice(0, 3);

  function openAdd() {
    setForm(defaultForm());
    setModal({ open: true });
  }

  function openEdit(item: EventDayItem) {
    setForm({
      title: item.title,
      category: item.category,
      ownerId: item.ownerId ?? '',
      scheduledTime: item.scheduledTime ?? '',
      status: item.status,
      priority: item.priority,
      notes: item.notes ?? '',
    });
    setModal({ open: true, editing: item });
  }

  function save() {
    if (!form.title.trim() || !selectedProjectId) return;
    const ownerMember = members.find((m) => m.id === form.ownerId);
    const now = new Date().toISOString();
    const item: EventDayItem = modal.editing
      ? { ...modal.editing, ...form, owner: ownerMember?.displayName, updatedAt: now }
      : {
          id: generateId(),
          projectId: selectedProjectId,
          title: form.title,
          category: form.category,
          ownerId: form.ownerId || undefined,
          owner: ownerMember?.displayName,
          scheduledTime: form.scheduledTime || undefined,
          status: form.status,
          priority: form.priority,
          notes: form.notes || undefined,
          createdAt: now,
          updatedAt: now,
        };
    saveEventDayItem(item);
    setModal({ open: false });
  }

  function quickStatus(item: EventDayItem, status: EventDayItemStatus) {
    saveEventDayItem({ ...item, status, updatedAt: new Date().toISOString() });
  }

  function copySummary() {
    const lines = [
      `RCCS Event-Day Summary — ${project?.name ?? 'Unknown'}`,
      `Date: ${project?.finalEventDate ?? todayISO()}`,
      `Readiness: ${readinessPercent}% (${completed.length}/${items.length} done)`,
      '',
      problems.length > 0 ? `PROBLEMS (${problems.length}):` : '',
      ...problems.map((i) => `  ⚠ [${i.category}] ${i.title}${i.owner ? ` (${i.owner})` : ''}`),
      '',
      'CHECKLIST:',
      ...items.map((i) => `  [${i.status === 'Completed' ? '✓' : i.status === 'Problem' ? '⚠' : ' '}] ${i.scheduledTime ? i.scheduledTime + ' ' : ''}${i.title} (${i.category}${i.owner ? ` · ${i.owner}` : ''})`),
    ].filter((l) => l !== null && l !== undefined).join('\n');
    navigator.clipboard?.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function printChecklist() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Event-Day Checklist — ${project?.name}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:720px;margin:24px auto;color:#0f172a}
      h1{font-size:18px;margin-bottom:4px}p{font-size:13px;color:#64748b}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding:6px 8px;border-bottom:2px solid #e2e8f0}
      td{padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:13px}
      .prob{color:#dc2626;font-weight:bold}.done{color:#16a34a}</style></head>
      <body><h1>Event-Day Checklist</h1><p>${project?.name ?? ''} · ${project?.finalEventDate ?? ''}</p>
      <p>Readiness: ${readinessPercent}% · ${items.length} items</p>
      <table><tr><th>Time</th><th>Item</th><th>Category</th><th>Owner</th><th>Status</th><th>Priority</th></tr>
      ${items.map((i) => `<tr class="${i.status === 'Problem' ? 'prob' : i.status === 'Completed' ? 'done' : ''}">
        <td>${i.scheduledTime ?? '—'}</td><td>${i.title}</td><td>${i.category}</td>
        <td>${i.owner ?? '—'}</td><td>${i.status}</td><td>${i.priority}</td></tr>`).join('')}
      </table></body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <PageHeader
        title="Event Day"
        description="Live event checklist and readiness tracker for RCCS events."
        actions={
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost text-sm" onClick={copySummary}><Copy size={13} /> {copied ? 'Copied!' : 'Copy Summary'}</button>
            <button className="btn-ghost text-sm" onClick={printChecklist}><Printer size={13} /> Print</button>
            <button className="btn-primary text-sm" onClick={openAdd} disabled={!selectedProjectId}><Plus size={14} /> Add Item</button>
          </div>
        }
      />

      {/* Project selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="select flex-1 min-w-52 text-sm"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">— Select project —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.status})</option>)}
        </select>
        {project?.finalEventDate && (
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
            Event date: {new Date(project.finalEventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      {!selectedProjectId ? (
        <Card className="py-12 text-center">
          <PartyPopper size={24} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Choose a project to prepare its live event checklist.</p>
        </Card>
      ) : (
        <>
          <div className="glass-panel-strong rounded-[var(--radius-xl)] p-4 grid md:grid-cols-3 gap-3 sticky top-0 z-10">
            <div>
              <p className="text-xs text-slate-500 mb-1">Now</p>
              <p className="text-sm font-semibold text-white truncate">{nowItems[0]?.title ?? 'No live blockers'}</p>
              <p className="text-xs text-slate-500">{nowItems[0]?.owner ?? 'Team standing by'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Next</p>
              <p className="text-sm font-semibold text-white truncate">{nextItems[0]?.title ?? 'Checklist clear'}</p>
              <p className="text-xs text-slate-500">{nextItems[0]?.scheduledTime ?? 'No time set'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Problems</p>
              <p className={`text-sm font-semibold ${problems.length > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {problems.length > 0 ? `${problems.length} open` : 'None open'}
              </p>
              <p className="text-xs text-slate-500">{readinessPercent}% ready</p>
            </div>
          </div>

          {/* Readiness bar */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Team Readiness</h2>
              <span className={`text-sm font-bold ${readinessPercent === 100 ? 'text-emerald-400' : readinessPercent >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {readinessPercent}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${readinessPercent === 100 ? 'bg-emerald-500' : readinessPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="text-red-400">{problems.length} problem{problems.length !== 1 ? 's' : ''}</span>
              <span>{notReady.length} not ready</span>
              <span className="text-emerald-400">{completed.length} completed</span>
              <span className="text-slate-600">{items.length} total</span>
            </div>
          </Card>

          {/* Problems — shown prominently */}
          {problems.length > 0 && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle size={14} /> Open Problems ({problems.length})
              </h3>
              <div className="space-y-2">
                {problems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-200 truncate">{item.title}</p>
                      <p className="text-xs text-red-400">{item.category}{item.owner ? ` · ${item.owner}` : ''}{item.notes ? ` — ${item.notes}` : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900" onClick={() => quickStatus(item, 'In Progress')}>In Progress</button>
                      <button className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900" onClick={() => quickStatus(item, 'Completed')}>Done</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select className="select w-36 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EventDayItemCategory | 'All')}>
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="select w-36 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EventDayItemStatus | 'All')}>
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Checklist */}
          {filtered.length === 0 ? (
            <Card className="py-10 text-center text-slate-500 text-sm">
              No items yet. Add the first item to start the event-day checklist.
            </Card>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-900 border border-slate-800 border-l-2 ${STATUS_BORDER[item.status]} rounded-lg px-3 py-2.5 flex items-center gap-3`}
                >
                  {/* Status pill */}
                  <select
                    value={item.status}
                    onChange={(e) => quickStatus(item, e.target.value as EventDayItemStatus)}
                    className={`text-xs px-2 py-0.5 rounded-full border-0 font-medium cursor-pointer shrink-0 ${STATUS_COLORS[item.status]}`}
                    style={{ background: 'transparent' }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Time */}
                  {item.scheduledTime && (
                    <span className="text-xs text-slate-500 shrink-0 w-12">{item.scheduledTime}</span>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${item.status === 'Completed' ? 'line-through text-slate-500' : item.status === 'Problem' ? 'text-red-300 font-medium' : 'text-slate-200'} ${PRIORITY_COLOR[item.priority]}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.category}
                      {item.owner && ` · ${item.owner}`}
                      {item.notes && ` — ${item.notes}`}
                    </p>
                  </div>

                  {/* Priority indicator */}
                  {item.priority !== 'Normal' && (
                    <span className={`text-xs shrink-0 ${item.priority === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>
                      {item.priority}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-ghost p-1" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                    <button className="btn-ghost p-1 text-red-500" onClick={() => setConfirmDel(item)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit modal */}
      {modal.open && (
        <Modal open={modal.open} title={modal.editing ? 'Edit Checklist Item' : 'Add Checklist Item'} onClose={() => setModal({ open: false })}>
          <div className="space-y-4">
            <div>
              <label className="field-label">Item</label>
              <input className="input" placeholder="e.g. Registration desk ready" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Category</label>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventDayItemCategory })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as EventDayItemPriority })}>
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Status</label>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventDayItemStatus })}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Scheduled Time</label>
                <input className="input" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="field-label">Owner</label>
              <MemberSelect
                members={members}
                value={form.ownerId}
                onChange={(id) => setForm({ ...form, ownerId: id ?? '' })}
                placeholder="Assign owner…"
              />
            </div>
            <div>
              <label className="field-label">Notes</label>
              <input className="input" placeholder="Optional notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-ghost" onClick={() => setModal({ open: false })}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.title.trim()}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          open={!!confirmDel}
          title="Delete item?"
          message={`Delete "${confirmDel.title}"? This cannot be undone.`}
          onConfirm={() => { deleteEventDayItem(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
