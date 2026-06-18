/**
 * CommandMenu — Ctrl/Cmd+K global command palette (Phase Six).
 * Supports entity search and quick actions.
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FolderKanban, ListTodo, Rocket, CalendarCheck, Handshake,
  Wallet, CheckSquare, Package, Sun, Crosshair, Calendar, Users,
  BookOpen, Settings2, PartyPopper, ArrowRight, X,
} from 'lucide-react';
import { useAppData } from '../state/AppDataContext';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: 'navigation' | 'quick-action' | 'project' | 'person';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  navigation:   'Navigation',
  'quick-action': 'Quick Actions',
  project:      'Projects',
  person:       'People',
};

export default function CommandMenu({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const nav = (to: string) => { navigate(to); onClose(); };

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // Navigation
      { id: 'nav-today',    label: 'Today',    icon: Sun,         group: 'navigation', action: () => nav('/today') },
      { id: 'nav-focus',    label: 'Focus',    icon: Crosshair,   group: 'navigation', action: () => nav('/focus') },
      { id: 'nav-cal',      label: 'Calendar', icon: Calendar,    group: 'navigation', action: () => nav('/calendar') },
      { id: 'nav-proj',     label: 'Projects', icon: FolderKanban,group: 'navigation', action: () => nav('/projects') },
      { id: 'nav-launches', label: 'Launches', icon: Rocket,      group: 'navigation', action: () => nav('/launches') },
      { id: 'nav-meet',     label: 'Meetings', icon: CalendarCheck,group: 'navigation', action: () => nav('/meetings') },
      { id: 'nav-approve',  label: 'Approvals',icon: CheckSquare, group: 'navigation', action: () => nav('/approvals') },
      { id: 'nav-people',   label: 'People',   icon: Users,       group: 'navigation', action: () => nav('/people') },
      { id: 'nav-money',    label: 'Money',    icon: Wallet,      group: 'navigation', action: () => nav('/money') },
      { id: 'nav-library',  label: 'Library',  icon: BookOpen,    group: 'navigation', action: () => nav('/library') },
      { id: 'nav-system',   label: 'System',   icon: Settings2,   group: 'navigation', action: () => nav('/system') },
      { id: 'nav-eventday', label: 'Event Day',icon: PartyPopper, group: 'navigation', action: () => nav('/event-day') },
      // Quick Actions
      { id: 'qa-new-proj',  label: 'New Project',     icon: FolderKanban, group: 'quick-action', action: () => nav('/projects?new=1') },
      { id: 'qa-new-task',  label: 'New Task',         icon: ListTodo,     group: 'quick-action', action: () => nav('/projects') },
      { id: 'qa-new-launch',label: 'New Launch',       icon: Rocket,       group: 'quick-action', action: () => nav('/launches?new=1') },
      { id: 'qa-new-meet',  label: 'New Meeting',      icon: CalendarCheck,group: 'quick-action', action: () => nav('/meetings?new=1') },
      { id: 'qa-new-spon',  label: 'New Sponsor',      icon: Handshake,    group: 'quick-action', action: () => nav('/money?new=1') },
      { id: 'qa-new-txn',   label: 'New Transaction',  icon: Wallet,       group: 'quick-action', action: () => nav('/money?new=1') },
      { id: 'qa-new-appr',  label: 'New Approval',     icon: CheckSquare,  group: 'quick-action', action: () => nav('/approvals?new=1') },
      { id: 'qa-new-del',   label: 'New Deliverable',  icon: Package,      group: 'quick-action', action: () => nav('/projects') },
      // Projects
      ...data.projects.map((p) => ({
        id: `proj-${p.id}`,
        label: p.name,
        description: `${p.status} · ${p.year}`,
        icon: FolderKanban,
        group: 'project' as const,
        action: () => nav(`/projects/${p.id}`),
      })),
      // People
      ...data.members.map((m) => ({
        id: `mem-${m.id}`,
        label: m.displayName,
        description: `${m.role} · ${m.committee}`,
        icon: Users,
        group: 'person' as const,
        action: () => nav(`/people`),
      })),
    ];
    return items;
  }, [data.projects, data.members]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.filter((i) => i.group === 'navigation' || i.group === 'quick-action');
    const q = query.toLowerCase();
    return allItems.filter((i) =>
      i.label.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allItems, query]);

  const grouped = useMemo(() => {
    const g: Record<string, CommandItem[]> = {};
    filtered.forEach((i) => {
      if (!g[i.group]) g[i.group] = [];
      g[i.group].push(i);
    });
    return g;
  }, [filtered]);

  const [selected, setSelected] = useState(0);

  useEffect(() => { setSelected(0); }, [filtered]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].action(); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl glass-panel-strong rounded-[var(--radius-xl)] shadow-2xl overflow-hidden motion-safe-pop"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300" aria-label="Close command menu">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No results for "{query}"</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {GROUP_LABELS[group] ?? group}
                </p>
                {items.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        globalIdx === selected ? 'bg-blue-400/14 text-blue-200' : 'hover:bg-white/8 text-slate-300'
                      }`}
                    >
                      <item.icon size={15} className="shrink-0 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.label}</p>
                        {item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
                      </div>
                      <ArrowRight size={12} className="text-slate-700 shrink-0" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4 text-[10px] text-slate-600">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
