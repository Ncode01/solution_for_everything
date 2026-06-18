import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Copy, Plus, Printer } from 'lucide-react';
import { EventDayItem, EventDayItemCategory, EventDayItemPriority, EventDayItemStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { generateId, todayISO } from '../../lib/dateUtils';
import MemberSelect from '../../components/MemberSelect';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import LiveCockpit from '../../components/layout/LiveCockpit';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import PersonToken from '../../components/design/PersonToken';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';

const STATUSES: EventDayItemStatus[] = ['Not Ready', 'Ready', 'In Progress', 'Completed', 'Problem'];
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

export default function EventDayPage() {
  const [params] = useSearchParams();
  const { data, saveEventDayItem, deleteEventDayItem } = useAppData();
  const { projects, members, eventDayItems = [] } = data;
  const [selectedProjectId, setSelectedProjectId] = useState(params.get('project') ?? projects.find((project) => project.status === 'Event Week' || project.status === 'Active')?.id ?? projects[0]?.id ?? '');
  const [categoryFilter, setCategoryFilter] = useState<EventDayItemCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<EventDayItemStatus | 'All'>('All');
  const [modal, setModal] = useState<{ open: boolean; editing?: EventDayItem }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<EventDayItem | null>(null);
  const [form, setForm] = useState<ItemFormData>(defaultForm());
  const [copied, setCopied] = useState(false);

  const project = projects.find((item) => item.id === selectedProjectId);
  const items = eventDayItems.filter((item) => item.projectId === selectedProjectId);
  const filtered = items.filter((item) => (categoryFilter === 'All' || item.category === categoryFilter) && (statusFilter === 'All' || item.status === statusFilter)).sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''));
  const problems = items.filter((item) => item.status === 'Problem');
  const completed = items.filter((item) => item.status === 'Completed');
  const readinessPercent = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;
  const nowItems = items.filter((item) => item.status === 'In Progress' || item.status === 'Problem');
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
      <LiveCockpit
        header={(
          <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(0,0.7fr))]">
            <div className="space-y-2">
              <select className="select" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={copySummary}><Copy size={13} /> {copied ? 'Copied' : 'Copy Summary'}</button>
                <button className="btn-secondary" onClick={printChecklist}><Printer size={13} /> Print</button>
                <button className="btn-primary" onClick={openAdd}><Plus size={14} /> Add Item</button>
              </div>
            </div>
            <Card className="p-4">
              <div className="text-xs text-[var(--text-tertiary)]">Readiness</div>
              <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{readinessPercent}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-[var(--text-tertiary)]">Now</div>
              <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">{nowItems[0]?.title ?? 'No live blockers'}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-[var(--text-tertiary)]">Problems</div>
              <div className="mt-1 text-sm font-medium text-[var(--danger)]">{problems.length} open</div>
            </Card>
          </div>
        )}
        problems={(
          <WorkQueue title="Problems queue">
            {problems.length === 0 ? (
              <EmptyMoment title="No live problems" description="The current event-day board is clear." />
            ) : (
              problems.map((item) => (
                <WorkQueueRow
                  key={item.id}
                  title={item.title}
                  meta={`${item.category}${item.notes ? ` · ${item.notes}` : ''}`}
                  owner={item.owner ? <PersonToken name={item.owner} compact /> : <span>Unassigned</span>}
                  due={item.scheduledTime || 'No time'}
                  action={<div className="flex gap-2"><button className="btn-secondary text-xs" onClick={() => quickStatus(item, 'In Progress')}>In Progress</button><button className="btn-primary text-xs" onClick={() => quickStatus(item, 'Completed')}>Done</button></div>}
                  tone="critical"
                />
              ))
            )}
          </WorkQueue>
        )}
        timeline={(
          <WorkQueue title="Now / next agenda rail">
            {nextItems.length === 0 ? (
              <EmptyMoment title="Nothing queued" description="Add the next checklist item to keep the run-of-show visible." />
            ) : (
              nextItems.map((item) => (
                <WorkQueueRow
                  key={item.id}
                  title={item.title}
                  meta={item.category}
                  owner={item.owner ? <PersonToken name={item.owner} compact /> : <span>Unassigned</span>}
                  due={item.scheduledTime || 'No time'}
                  status={<StatusBadge status={item.status} />}
                  tone={item.priority === 'Critical' ? 'critical' : item.priority === 'High' ? 'warning' : 'accent'}
                />
              ))
            )}
          </WorkQueue>
        )}
        checklist={(
          <WorkQueue title="Checklist">
            {groupedChecklist.length === 0 ? (
              <EmptyMoment title="No checklist items yet" description="Add the first event-day item to start the operational checklist." />
            ) : (
              groupedChecklist.flatMap((group) => [
                <div key={`label-${group.category}`} className="border-b border-[var(--border-hairline)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] md:px-5">{group.category}</div>,
                ...group.items.map((item) => (
                  <WorkQueueRow
                    key={item.id}
                    title={item.title}
                    meta={item.notes}
                    owner={item.owner ? <PersonToken name={item.owner} compact /> : <span>Unassigned</span>}
                    due={item.scheduledTime || 'No time'}
                    status={<StatusBadge status={item.status} />}
                    action={<div className="flex gap-2"><button className="btn-ghost text-xs" onClick={() => openEdit(item)}>Edit</button><button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDel(item)}>Delete</button></div>}
                    tone={item.status === 'Problem' ? 'critical' : item.priority === 'Critical' ? 'warning' : 'neutral'}
                  />
                )),
              ])
            )}
          </WorkQueue>
        )}
        rail={(
          <Card className="space-y-3 p-4">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Filters</div>
            <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EventDayItemCategory | 'All')}>
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EventDayItemStatus | 'All')}>
              <option value="All">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
            <div className="text-xs text-[var(--text-tertiary)]">Event-day mode stays mostly solid for legibility under pressure.</div>
          </Card>
        )}
      />

      {modal.open && (
        <Modal open={modal.open} title={modal.editing ? 'Edit Checklist Item' : 'Add Checklist Item'} onClose={() => setModal({ open: false })}>
          <div className="space-y-4">
            <div><label className="field-label">Item</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Category</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventDayItemCategory })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
              <div><label className="field-label">Priority</label><select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as EventDayItemPriority })}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Status</label><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventDayItemStatus })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
              <div><label className="field-label">Scheduled Time</label><input className="input" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div>
            </div>
            <div><label className="field-label">Owner</label><MemberSelect members={members} value={form.ownerId} onChange={(id) => setForm({ ...form, ownerId: id ?? '' })} placeholder="Assign owner..." /></div>
            <div><label className="field-label">Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!confirmDel} title="Delete item?" message={`Delete "${confirmDel?.title}"?`} onConfirm={() => { if (confirmDel) deleteEventDayItem(confirmDel.id); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
    </ScreenCanvas>
  );
}
