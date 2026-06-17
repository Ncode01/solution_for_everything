import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, ListTodo, Target, Megaphone, Flag,
  CalendarCheck, Handshake, Copy, Check, LayoutGrid, List, X,
} from 'lucide-react';
import { Project, Meeting, Sponsor, Member } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { isOverdue, daysUntil, formatDateShort } from '../../lib/dateUtils';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

type ItemType = 'task' | 'milestone' | 'pr' | 'event' | 'meeting' | 'sponsor';
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
  link: string;
}

function buildItems(projects: Project[], meetings: Meeting[], sponsors: Sponsor[], members: Member[]): CalendarItem[] {
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
        extra: `${pr.platform} · ${pr.publishTime}`,
        link: '/pr-planner',
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
        status: s.stage, extra: `${resolveName(s.assignedMemberId || s.assignedMember)} · ${s.stage}`,
        link: '/budget',
      });
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
};

const TYPE_DOT: Record<ItemType, string> = {
  task:      'bg-blue-500',
  milestone: 'bg-amber-500',
  pr:        'bg-violet-500',
  event:     'bg-emerald-500',
  meeting:   'bg-cyan-500',
  sponsor:   'bg-orange-500',
};

const TYPE_ICONS: Record<ItemType, React.ReactNode> = {
  task:      <ListTodo size={12} />,
  milestone: <Target size={12} />,
  pr:        <Megaphone size={12} />,
  event:     <Flag size={12} />,
  meeting:   <CalendarCheck size={12} />,
  sponsor:   <Handshake size={12} />,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filter, setFilter] = useState<FilterType>('all');
  const [projectFilter, setProjectFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allItems = useMemo(
    () => buildItems(data.projects, data.meetings, data.sponsors, data.members),
    [data]
  );

  const todayStr = now.toISOString().slice(0, 10);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // Build grid days for current month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const gridDays: Array<{ date: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayIdx = i - startPad + 1;
    if (dayIdx < 1 || dayIdx > lastDay.getDate()) {
      gridDays.push({ date: null, dayNum: null });
    } else {
      const d = new Date(year, month, dayIdx);
      gridDays.push({ date: d.toISOString().slice(0, 10), dayNum: dayIdx });
    }
  }

  function applyFilters(item: CalendarItem, dateStr?: string): boolean {
    const matchMonth = dateStr
      ? item.date === dateStr
      : item.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
    const matchType = filter === 'all' || item.type === filter;
    const matchProject = projectFilter === 'All' || item.projectId === projectFilter;
    const matchMember = memberFilter === 'All' || (item.extra?.includes(memberFilter) ?? false);
    return matchMonth && matchType && matchProject && matchMember;
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
      return item.date === dateStr && matchType && matchProject;
    });
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
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
    { value: 'pr',        label: 'PR Posts',   icon: <Megaphone size={13} /> },
    { value: 'meeting',   label: 'Meetings',   icon: <CalendarCheck size={13} /> },
    { value: 'event',     label: 'Events',     icon: <Flag size={13} /> },
    { value: 'sponsor',   label: 'Follow-ups', icon: <Handshake size={13} /> },
  ];

  // Selected day modal items
  const selectedItems = selectedDay ? dayItems(selectedDay) : [];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <PageHeader
        title="Calendar"
        description="Deadlines, posts, meetings, events, and sponsor follow-ups."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-ghost p-2" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={goToday}>Today</button>
            <span className="text-white font-semibold min-w-36 text-center text-sm">{monthLabel}</span>
            <button className="btn-ghost p-2" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
        }
      />

      {/* Filters row */}
      <div className="flex gap-2 flex-wrap items-center">
        {FILTER_OPTS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
        <div className="flex gap-2 ml-auto items-center">
          <select className="select text-xs h-8 py-0 px-2 w-40" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid view"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors ${viewMode === 'agenda' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Agenda view"
            >
              <List size={13} />
            </button>
          </div>
          <button
            onClick={exportAgenda}
            className="btn-secondary text-xs flex items-center gap-1.5 h-8 px-3"
            title="Copy agenda to clipboard"
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Export</>}
          </button>
        </div>
      </div>

      {/* ── GRID VIEW ──────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="card overflow-hidden">
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
                    className={`min-h-24 bg-slate-950/40 ${idx % 7 !== 6 ? '' : ''} ${Math.floor(idx / 7) > 0 ? 'border-t border-slate-800/60' : ''}`}
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
                    ${isToday ? 'bg-blue-950/20 hover:bg-blue-950/30' : isPast ? 'bg-slate-950/20 hover:bg-slate-900/50' : 'hover:bg-slate-800/30'}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-blue-500 text-white' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
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
              <p className="text-xs text-slate-600 mt-1">Try switching months or adjusting filters.</p>
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

      {/* ── DAY DETAIL MODAL ────────────────────────────────────────────── */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">
                  {new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="btn-ghost p-1.5 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {selectedItems.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No items for this day.</p>
              ) : (
                selectedItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => { navigate(item.link); setSelectedDay(null); }}
                    className={`w-full text-left rounded-lg border border-slate-800 border-l-2 ${TYPE_COLORS[item.type].split(' ').filter(c => c.startsWith('border-l')).join(' ')} px-3 py-2.5 hover:border-slate-600 transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-slate-400">{TYPE_ICONS[item.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-200 truncate">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.projectName}{item.extra ? ` · ${item.extra}` : ''}</p>
                      </div>
                      {item.status && <StatusBadge status={item.status} />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LEGEND ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {(Object.keys(TYPE_DOT) as ItemType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${TYPE_DOT[t]}`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
