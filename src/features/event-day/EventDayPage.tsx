import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, MoreHorizontal, Plus, Printer } from 'lucide-react';
import { EventDayItem, EventDayItemCategory, EventDayItemPriority, EventDayItemStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { generateId, todayISO } from '../../lib/dateUtils';
import MemberSelect from '../../components/MemberSelect';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import PersonToken from '../../components/design/PersonToken';
import Card from '../../components/Card';
import ViewAllButton from '../../components/layout/ViewAllButton';

const STATUSES: EventDayItemStatus[] = ['Not Ready', 'Ready', 'In Progress', 'Completed', 'Problem'];
const QUICK_STATUSES: EventDayItemStatus[] = ['Not Ready', 'Ready', 'In Progress', 'Completed', 'Problem'];
const CATEGORIES: EventDayItemCategory[] = ['Agenda', 'Guest', 'Registration', 'AV', 'Certificates', 'Refreshments', 'Stage', 'Media', 'Logistics', 'Emergency', 'Other'];
const PRIORITIES: EventDayItemPriority[] = ['Normal', 'High', 'Critical'];

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

function StatusQuickButtons({
  current,
  onSelect,
  size = 'md',
}: {
  current: EventDayItemStatus;
  onSelect: (status: EventDayItemStatus) => void;
  size?: 'sm' | 'md';
}) {
  const btnClass = size === 'md'
    ? 'min-h-[36px] min-w-[72px] px-2.5 py-2 text-xs font-medium rounded-lg'
    : 'min-h-[32px] px-2 py-1.5 text-[10px] font-medium rounded-md';

  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {QUICK_STATUSES.map((status) => {
        const active = current === status;
        const tone = status === 'Problem' ? 'bg-red-500/12 text-red-100 ring-red-500/20'
          : status === 'Completed' ? 'bg-emerald-500/12 text-emerald-100 ring-emerald-500/20'
          : status === 'In Progress' ? 'bg-blue-500/12 text-blue-100 ring-blue-500/20'
          : status === 'Ready' ? 'bg-cyan-500/12 text-cyan-100 ring-cyan-500/20'
          : 'bg-white/[0.04] text-[var(--text-secondary)] ring-white/10';
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            className={`${btnClass} ring-1 transition-colors ${active ? `${tone} ring-2` : `${tone} opacity-80 hover:opacity-100`}`}
          >
            {status === 'Completed' ? 'Done' : status}
          </button>
        );
      })}
    </div>
  );
}

export default function EventDayPage() {
  const [params] = useSearchParams();
  const { data, saveEventDayItem, deleteEventDayItem } = useAppData();
  const { projects, members, eventDayItems = [] } = data;
  const [selectedProjectId, setSelectedProjectId] = useState(params.get('project') ?? projects.find((project) => project.status === 'Event Week' || project.status === 'Active')?.id ?? projects[0]?.id ?? '');
  const [categoryFilter, setCategoryFilter] = useState<EventDayItemCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<EventDayItemStatus | 'All'>('All');
  const [modal, setModal] = useState<{ open: boolean; editing?: EventDayItem }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<EventDayItem | null>(null);
  const [moreMenu, setMoreMenu] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormData>(defaultForm());
  const [copied, setCopied] = useState(false);
  const [showAllProblems, setShowAllProblems] = useState(false);

  const project = projects.find((item) => item.id === selectedProjectId);
  const items = eventDayItems.filter((item) => item.projectId === selectedProjectId);
  const filtered = items.filter((item) => (categoryFilter === 'All' || item.category === categoryFilter) && (statusFilter === 'All' || item.status === statusFilter)).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''));
  const problems = items.filter((item) => item.status === 'Problem');
  const completed = items.filter((item) => item.status === 'Completed');
  const readinessPercent = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;
  const nowItems = items.filter((item) => item.status === 'In Progress');
  const nextItems = items.filter((item) => item.status !== 'Completed' && item.status !== 'Problem').slice(0, 4);

  const groupedChecklist = useMemo(() => CATEGORIES.map((category) => ({
    category,
    items: filtered.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0), [filtered]);

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
    setMoreMenu(null);
  }

  function save() {
    if (!form.title.trim() || !selectedProjectId) return;
    const ownerMember = members.find((member) => member.id === form.ownerId);
    const now = new Date().toISOString();
    const item: EventDayItem = modal.editing
      ? { ...modal.editing, ...form, owner: ownerMember?.displayName, updatedAt: now }
      : { id: generateId(), projectId: selectedProjectId, title: form.title, category: form.category, ownerId: form.ownerId || undefined, owner: ownerMember?.displayName, scheduledTime: form.scheduledTime || undefined, status: form.status, priority: form.priority, notes: form.notes || undefined, createdAt: now, updatedAt: now };
    saveEventDayItem(item);
    setModal({ open: false });
  }

  function quickStatus(item: EventDayItem, status: EventDayItemStatus) {
    saveEventDayItem({ ...item, status, updatedAt: new Date().toISOString() });
  }

  function copySummary() {
    const lines = [
      `RCCS Event-Day Summary · ${project?.name ?? 'Unknown'}`,
      `Date: ${project?.finalEventDate ?? todayISO()}`,
      `Readiness: ${readinessPercent}% (${completed.length}/${items.length} done)`,
      '',
      ...problems.map((item) => `Problem · ${item.title}${item.owner ? ` (${item.owner})` : ''}`),
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function printChecklist() {
    window.print();
  }

  return (
    <ScreenCanvas variant="cockpit">
      <div className="-mx-4 mb-4 border-b border-[var(--border-subtle)] bg-[var(--surface-base)] px-4 py-3 md:-mx-6 md:px-6">
        <div className="grid gap-3 md:grid-cols-[minmax(200px,1fr)_repeat(4,minmax(0,0.5fr))]">
          <div className="space-y-2">
            <select className="select" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
              <option value="">Select project</option>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary text-xs" onClick={copySummary}><Copy size={13} /> {copied ? 'Copied' : 'Copy'}</button>
              <button className="btn-secondary text-xs" onClick={printChecklist}><Printer size={13} /> Print</button>
              <button className="btn-primary text-xs" onClick={openAdd}><Plus size={14} /> Add</button>
            </div>
          </div>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Readiness</div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">{readinessPercent}%</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Problems</div>
            <div className="text-lg font-semibold text-[var(--danger)]">{problems.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Now</div>
            <div className="truncate text-sm font-medium text-[var(--text-primary)]">{nowItems[0]?.title ?? 'Clear'}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Next</div>
            <div className="truncate text-sm font-medium text-[var(--text-primary)]">{nextItems[0]?.title ?? '—'}</div>
          </Card>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <select className="select text-xs h-8 w-36" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EventDayItemCategory | 'All')}>
            <option value="All">All categories</option>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select className="select text-xs h-8 w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EventDayItemStatus | 'All')}>
            <option value="All">All statuses</option>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <WorkQueue title="Problems queue">
        {problems.length === 0 ? (
          <EmptyMoment title="No live problems" description="The current event-day board is clear." />
        ) : (
          (showAllProblems ? problems : problems.slice(0, 5)).map((item) => (
            <div key={item.id} className="border-b border-[var(--border-hairline)] px-4 py-4 md:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</div>
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-100">Problem</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">{item.category} · {item.scheduledTime || 'No time'}</div>
                  {item.notes && <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.notes}</div>}
                  <div className="mt-2">{item.owner ? <PersonToken name={item.owner} detail="Owner" compact /> : <span className="text-xs text-[var(--warning)]">Unassigned</span>}</div>
                </div>
                <StatusQuickButtons
                  current={item.status}
                  onSelect={(status) => quickStatus(item, status)}
                  size="md"
                />
              </div>
            </div>
          ))
        )}
        {problems.length > 5 && <div className="px-4 py-3 md:px-5"><ViewAllButton count={problems.length} label={showAllProblems ? 'Collapse' : `+${problems.length - 5} more`} compact onClick={() => setShowAllProblems((current) => !current)} /></div>}
      </WorkQueue>

      <WorkQueue title="Checklist">
        {groupedChecklist.length === 0 ? (
          <EmptyMoment title="No checklist items yet" description="Add the first event-day item to start the operational checklist." />
        ) : (
          groupedChecklist.flatMap((group) => [
            <div key={`label-${group.category}`} className="border-b border-[var(--border-hairline)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] md:px-5">{group.category}</div>,
            ...group.items.map((item) => (
              <div
                key={item.id}
                className={`border-b border-[var(--border-hairline)] px-4 py-3 md:px-5 ${item.status === 'Completed' ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{item.title}</div>
                      {item.priority !== 'Normal' && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          item.priority === 'Critical'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
                            : 'border-blue-500/20 bg-blue-500/10 text-blue-100'
                        }`}>
                          {item.priority}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.scheduledTime || 'No time'}</span>
                    </div>
                    <div className="mt-1.5">{item.owner ? <PersonToken name={item.owner} compact /> : <span className="text-xs text-[var(--text-tertiary)]">Unassigned</span>}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusQuickButtons current={item.status} onSelect={(status) => quickStatus(item, status)} />
                    <div className="relative">
                      <button className="btn-ghost p-2" onClick={() => setMoreMenu(moreMenu === item.id ? null : item.id)} aria-label="More actions">
                        <MoreHorizontal size={16} />
                      </button>
                      {moreMenu === item.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1 shadow-lg">
                          <button className="block w-full px-3 py-2 text-left text-xs hover:bg-white/5" onClick={() => openEdit(item)}>Edit details</button>
                          <button className="block w-full px-3 py-2 text-left text-xs text-[var(--danger)] hover:bg-white/5" onClick={() => { setConfirmDel(item); setMoreMenu(null); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )),
          ])
        )}
      </WorkQueue>

      {modal.open && (
        <Modal open={modal.open} title={modal.editing ? 'Edit Checklist Item' : 'Add Checklist Item'} onClose={() => setModal({ open: false })}>
          <div className="space-y-4">
            <div><label className="field-label">Item</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Category</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventDayItemCategory })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
              <div><label className="field-label">Priority</label><select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as EventDayItemPriority })}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Scheduled Time</label><input className="input" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div>
              <div><label className="field-label">Owner</label><MemberSelect members={members} value={form.ownerId} onChange={(id) => setForm({ ...form, ownerId: id ?? '' })} placeholder="Assign owner..." /></div>
            </div>
            <div><label className="field-label">Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!confirmDel} title="Delete item?" message={`Delete "${confirmDel?.title}"?`} onConfirm={() => { if (confirmDel) deleteEventDayItem(confirmDel.id); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
    </ScreenCanvas>
  );
}
