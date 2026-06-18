import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, ListTodo, Target, Megaphone, Flag,
  CalendarCheck, Handshake, Copy, Check, LayoutGrid, List, Package, CheckSquare, Wallet,
} from 'lucide-react';
import { Project, Meeting, Sponsor, Member, Deliverable, ApprovalRequest, Transaction, EventDayItem } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { isOverdue, daysUntil, formatDateShort } from '../../lib/dateUtils';
import StatusBadge from '../../components/StatusBadge';
import { CalendarDayInspector, type CalendarDayItem as DayItem } from '../../components/inspectors/EntityInspectors';
import SegmentedControl from '../../components/design/SegmentedControl';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';

type ItemType = 'task' | 'milestone' | 'pr' | 'event' | 'meeting' | 'sponsor' | 'deliverable' | 'approval' | 'payment';
type FilterType = 'all' | ItemType;
type ViewMode = 'grid' | 'agenda';

interface CalendarItem {
  id: string;
  label: string;
  date: string;
  type: ItemType;
  projectName: string;
  projectId?: string;
  status?: string;
  extra?: string;
  ownerId?: string;
  link: string;
}

function buildItems(
  projects: Project[],
  meetings: Meeting[],
  sponsors: Sponsor[],
  members: Member[],
  deliverables: Deliverable[],
  approvals: ApprovalRequest[],
  transactions: Transaction[],
  eventDayItems: EventDayItem[],
): CalendarItem[] {
  const items: CalendarItem[] = [];

  function resolveName(idOrName: string | undefined, fallback = 'Unassigned') {
    if (!idOrName) return fallback;
    const m = members.find((x) => x.id === idOrName);
    return m ? m.displayName : idOrName || fallback;
  }

  projects.forEach((p) => {
    p.tasks.forEach((t) => {
      if (t.dueDate) items.push({
        id: t.id, label: t.title, date: t.dueDate, type: 'task',
        projectName: p.name, projectId: p.id, status: t.status,
        extra: `${resolveName(t.assigneeId || t.assignee)} · ${t.priority}`,
        link: `/projects/${p.id}`,
      });
    });
    p.milestones.forEach((m) => {
      if (m.dueDate) items.push({
        id: m.id, label: m.name, date: m.dueDate, type: 'milestone',
        projectName: p.name, projectId: p.id, status: m.status,
        extra: resolveName(m.ownerId || m.owner),
        link: `/projects/${p.id}`,
      });
    });
    p.prItems.forEach((pr) => {
      if (pr.publishDate) items.push({
        id: pr.id, label: pr.title, date: pr.publishDate, type: 'pr',
        projectName: p.name, projectId: p.id, status: pr.publishingStatus,
        extra: `${resolveName(pr.designerId || pr.designer)} · ${pr.platform}`,
        ownerId: pr.designerId,
        link: `/projects/${p.id}`,
      });
    });
    if (p.finalEventDate) items.push({
      id: `event-${p.id}`, label: `${p.name} — Final Event`, date: p.finalEventDate,
      type: 'event', projectName: p.name, projectId: p.id, extra: 'Final Event Day',
      link: `/projects/${p.id}`,
    });
  });

  meetings.forEach((m) => {
    if (m.date) {
      const proj = projects.find((p) => p.id === m.projectId);
      items.push({
        id: m.id, label: m.title, date: m.date, type: 'meeting',
        projectName: proj?.name ?? 'General', projectId: m.projectId,
        extra: `${m.type} · ${m.time}`, link: '/meetings',
      });
    }
  });

  sponsors.forEach((s) => {
    if (s.nextFollowUpDate && s.stage !== 'Completed' && s.stage !== 'Rejected') {
      const proj = projects.find((p) => p.id === s.projectId);
      items.push({
        id: `fu-${s.id}`, label: `Follow up: ${s.name}`, date: s.nextFollowUpDate,
        type: 'sponsor', projectName: proj?.name ?? 'General', projectId: s.projectId,
        status: s.stage,         extra: `${resolveName(s.assignedMemberId || s.assignedMember)} · ${s.stage}`,
        ownerId: s.assignedMemberId,
        link: '/money',
      });
    }
  });

  deliverables.forEach((d) => {
    if (d.dueDate) {
      const proj = projects.find((p) => p.id === d.projectId);
      items.push({
        id: d.id, label: d.title, date: d.dueDate, type: 'deliverable',
        projectName: proj?.name ?? 'General', projectId: d.projectId, status: d.status,
        extra: resolveName(d.ownerId || d.owner),
        ownerId: d.ownerId,
        link: `/projects/${d.projectId}?tab=timeline`,
      });
    }
  });

  approvals.forEach((a) => {
    if (a.submittedDate && (a.status === 'Submitted' || a.status === 'Changes Requested')) {
      const proj = projects.find((p) => p.id === a.projectId);
      items.push({
        id: a.id, label: a.title, date: a.submittedDate, type: 'approval',
        projectName: proj?.name ?? 'General', projectId: a.projectId, status: a.status,
        extra: a.approver,
        link: '/approvals',
      });
    }
  });

  transactions.forEach((t) => {
    if (t.date) {
      const proj = projects.find((p) => p.id === t.projectId);
      items.push({
        id: t.id, label: `${t.type}: ${t.category}`, date: t.date, type: 'payment',
        projectName: proj?.name ?? 'General', projectId: t.projectId,
        extra: `Rs ${t.amount.toLocaleString('en-LK')}`,
        link: '/money',
      });
    }
  });

  eventDayItems.forEach((e) => {
    if (e.scheduledTime) {
      const datePart = e.scheduledTime.slice(0, 10);
      if (datePart.length === 10) {
        const proj = projects.find((p) => p.id === e.projectId);
        items.push({
          id: e.id, label: e.title, date: datePart, type: 'event',
          projectName: proj?.name ?? 'General', projectId: e.projectId, status: e.status,
          extra: `${e.category} · ${resolveName(e.ownerId || e.owner)}`,
          ownerId: e.ownerId,
          link: `/event-day?project=${e.projectId}`,
        });
      }
    }
  });

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const TYPE_COLORS: Record<ItemType, string> = {
  task:      'border-l-blue-500 bg-blue-500/5',
  milestone: 'border-l-amber-500 bg-amber-500/5',
  pr:        'border-l-violet-500 bg-violet-500/5',
  event:     'border-l-emerald-500 bg-emerald-500/5',
  meeting:   'border-l-cyan-500 bg-cyan-500/5',
  sponsor:   'border-l-orange-500 bg-orange-500/5',
  deliverable: 'border-l-pink-500 bg-pink-500/5',
  approval:  'border-l-yellow-500 bg-yellow-500/5',
  payment:   'border-l-teal-500 bg-teal-500/5',
};

const TYPE_DOT: Record<ItemType, string> = {
  task:      'bg-blue-500',
  milestone: 'bg-amber-500',
  pr:        'bg-violet-500',
  event:     'bg-emerald-500',
  meeting:   'bg-cyan-500',
  sponsor:   'bg-orange-500',
  deliverable: 'bg-pink-500',
  approval:  'bg-yellow-500',
  payment:   'bg-teal-500',
};

const TYPE_ICONS: Record<ItemType, React.ReactNode> = {
  task:      <ListTodo size={12} />,
  milestone: <Target size={12} />,
  pr:        <Megaphone size={12} />,
  event:     <Flag size={12} />,
  meeting:   <CalendarCheck size={12} />,
  sponsor:   <Handshake size={12} />,
  deliverable: <Package size={12} />,
  approval:  <CheckSquare size={12} />,
  payment:   <Wallet size={12} />,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [filter, setFilter] = useState<FilterType>('all');
  const [projectFilter, setProjectFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allItems = useMemo(
    () => buildItems(
      data.projects, data.meetings, data.sponsors, data.members,
      data.deliverables ?? [], data.approvals, data.transactions, data.eventDayItems ?? [],
    ),
    [data]
  );

  const todayStr = now.toISOString().slice(0, 10);
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const monthStartStr = firstDay.toISOString().slice(0, 10);
  const monthEndStr = lastDay.toISOString().slice(0, 10);
  const monthLabel = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const gridDays: Array<{ date: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    gridDays.push({ date: null, dayNum: null });
  }
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(currentYear, currentMonth, day);
    gridDays.push({ date: d.toISOString().slice(0, 10), dayNum: day });
  }
  while (gridDays.length % 7 !== 0) {
    gridDays.push({ date: null, dayNum: null });
  }

  function applyFilters(item: CalendarItem, dateStr?: string): boolean {
    const matchRange = dateStr
      ? item.date === dateStr
      : item.date >= monthStartStr && item.date <= monthEndStr;
    const matchType = filter === 'all' || item.type === filter;
    const matchProject = projectFilter === 'All' || item.projectId === projectFilter;
    const matchMember = memberFilter === 'All' || item.ownerId === memberFilter || (item.extra?.includes(memberFilter) ?? false);
    return matchRange && matchType && matchProject && matchMember;
  }

  const filteredItems = allItems.filter((item) => applyFilters(item));

  // Group by date for agenda view
  const grouped: Record<string, CalendarItem[]> = {};
  filteredItems.forEach((item) => {
    (grouped[item.date] = grouped[item.date] || []).push(item);
  });
  const dates = Object.keys(grouped).sort();

  // Items per day cell
  function dayItems(dateStr: string): CalendarItem[] {
    return allItems.filter((item) => {
      const matchType = filter === 'all' || item.type === filter;
      const matchProject = projectFilter === 'All' || item.projectId === projectFilter;
      const matchMember = memberFilter === 'All' || item.ownerId === memberFilter || (item.extra?.includes(memberFilter) ?? false);
      return item.date === dateStr && matchType && matchProject && matchMember;
    });
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }
  function goToday() {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }

  function exportAgenda() {
    const lines: string[] = [`RCCS Agenda — ${monthLabel}`, ''];
    dates.forEach((date) => {
      const d = new Date(date);
      const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      lines.push(dayLabel);
      grouped[date].forEach((item) => {
        lines.push(`  [${item.type.toUpperCase()}] ${item.label} — ${item.projectName}${item.extra ? ` (${item.extra})` : ''}`);
      });
      lines.push('');
    });
    if (dates.length === 0) lines.push('No items in this month.');
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function relativeLabel(date: string): string | null {
    if (date === todayStr) return 'Today';
    const d = daysUntil(date);
    if (d > 0 && d <= 7) return 'This week';
    return null;
  }

  const FILTER_OPTS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all',       label: 'All',        icon: <CalendarDays size={13} /> },
    { value: 'task',      label: 'Tasks',      icon: <ListTodo size={13} /> },
    { value: 'milestone', label: 'Milestones', icon: <Target size={13} /> },
    { value: 'deliverable', label: 'Deliverables', icon: <Package size={13} /> },
    { value: 'pr',        label: 'Launches',   icon: <Megaphone size={13} /> },
    { value: 'meeting',   label: 'Meetings',   icon: <CalendarCheck size={13} /> },
    { value: 'event',     label: 'Events',     icon: <Flag size={13} /> },
    { value: 'sponsor',   label: 'Follow-ups', icon: <Handshake size={13} /> },
    { value: 'approval',  label: 'Approvals',  icon: <CheckSquare size={13} /> },
    { value: 'payment',   label: 'Payments',   icon: <Wallet size={13} /> },
  ];

  // Selected day modal items
  const selectedItems = selectedDay ? dayItems(selectedDay) : [];

  return (
    <ScreenCanvas variant="calendar">
      <CommandHero
        title="Calendar"
        description="Deadlines, launches, meetings, approvals, and event work for the selected month."
        primaryAction={<button className="btn-secondary text-xs px-3 py-1.5" onClick={goToday}>Today</button>}
        secondaryActions={
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-ghost p-2" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className="text-[var(--text-primary)] font-semibold min-w-48 text-center text-sm">{monthLabel}</span>
            <button className="btn-ghost p-2" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
        }
      />

      <ContextActionBar>
        {FILTER_OPTS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value ? 'bg-[var(--royal)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
        <div className="flex gap-2 ml-auto items-center">
          <select className="select text-xs h-8 py-0 px-2 w-40" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
            <option value="All">All People</option>
            {data.members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
          </select>
          <select className="select text-xs h-8 py-0 px-2 w-40" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <SegmentedControl
            size="sm"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Grid', icon: <LayoutGrid size={13} /> },
              { value: 'agenda', label: 'Agenda', icon: <List size={13} /> },
            ]}
          />
          <button
            onClick={exportAgenda}
            className="btn-secondary text-xs flex items-center gap-1.5 h-8 px-3"
            title="Copy agenda to clipboard"
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Export</>}
          </button>
        </div>
      </ContextActionBar>

      {/* ── GRID VIEW ──────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="solid-panel overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-slate-800/60">
            {gridDays.map((cell, idx) => {
              if (!cell.date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className={`min-h-24 bg-slate-950/30 ${Math.floor(idx / 7) > 0 ? 'border-t border-slate-800/60' : ''}`}
                  />
                );
              }

              const items = dayItems(cell.date);
              const isToday = cell.date === todayStr;
              const isPast = cell.date < todayStr;
              const displayItems = items.slice(0, 3);
              const extra = items.length - 3;

              return (
                <div
                  key={cell.date}
                  onClick={() => { if (items.length > 0) setSelectedDay(cell.date); }}
                  className={`min-h-24 p-1.5 flex flex-col gap-0.5 cursor-pointer transition-colors select-none
                    ${Math.floor(idx / 7) > 0 ? 'border-t border-slate-800/60' : ''}
                    ${isToday ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-300/30 hover:bg-blue-500/15' : isPast ? 'bg-slate-950/20 hover:bg-slate-900/50' : 'hover:bg-white/6'}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-blue-500 text-white ring-2 ring-blue-400/60' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
                      {cell.dayNum}
                    </span>
                    {items.length > 0 && (
                      <span className="text-xs text-slate-600">{items.length}</span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {displayItems.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={(e) => { e.stopPropagation(); navigate(item.link); }}
                        className={`w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate hover:opacity-80 border-l-2 ${TYPE_COLORS[item.type].split(' ').filter(c => c.startsWith('border-l')).join(' ')}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[item.type]}`} />
                        <span className="truncate text-slate-300">{item.label}</span>
                      </button>
                    ))}
                    {extra > 0 && (
                      <span className="text-xs text-slate-500 px-1">+{extra} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AGENDA VIEW ────────────────────────────────────────────────── */}
      {viewMode === 'agenda' && (
        <>
          {dates.length === 0 ? (
            <div className="card text-center py-12">
              <CalendarDays size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No items in {monthLabel}</p>
              <p className="text-xs text-slate-600 mt-1">Try another month or adjust filters.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {dates.map((date) => {
                const d = new Date(date);
                const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
                const isPast = isOverdue(date);
                const isToday = date === todayStr;
                const rel = relativeLabel(date);
                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`text-sm font-semibold ${isToday ? 'text-blue-400' : isPast ? 'text-red-400/70' : 'text-slate-300'}`}>
                        {dayLabel}
                        {rel && <span className="ml-2 text-xs bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-600/30">{rel}</span>}
                      </div>
                      <div className="flex-1 h-px bg-slate-800" />
                      <span className="text-xs text-slate-600">{grouped[date].length} item{grouped[date].length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {grouped[date].map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => navigate(item.link)}
                          className={`w-full text-left bg-slate-900 border border-slate-800 border-l-2 ${TYPE_COLORS[item.type].split(' ').filter(c => c.startsWith('border-l')).join(' ')} rounded-lg py-2.5 px-3 hover:border-slate-700 transition-colors`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="mt-0.5 shrink-0 text-slate-400">{TYPE_ICONS[item.type]}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-200 leading-tight">{item.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{item.projectName}{item.extra ? ` · ${item.extra}` : ''}</p>
                              </div>
                            </div>
                            {item.status && <StatusBadge status={item.status} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Day detail slide-over */}
      <CalendarDayInspector
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        date={selectedDay}
        items={selectedItems as DayItem[]}
        onItemClick={(item) => { navigate(item.link); setSelectedDay(null); }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {(Object.keys(TYPE_DOT) as ItemType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${TYPE_DOT[t]}`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>
    </ScreenCanvas>
  );
}
