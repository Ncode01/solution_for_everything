import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sun,
  Crosshair,
  CalendarDays,
  FolderKanban,
  Rocket,
  Users,
  CalendarCheck,
  CheckSquare,
  Wallet,
  BookOpen,
  Settings2,
  Hexagon,
  Wifi,
  WifiOff,
  PartyPopper,
} from 'lucide-react';
import { getConnectionMode } from '../lib/supabaseClient';
import { canAccessRoute, type NavRoute } from '../lib/navigationAccess';
import { UserRole } from '../types';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  role?: UserRole | string;
}

const NAV_GROUPS: { heading: string; items: { to: NavRoute; icon: React.ElementType; label: string }[] }[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/today', icon: Sun, label: 'Today' },
      { to: '/focus', icon: Crosshair, label: 'Focus' },
      { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/launches', icon: Rocket, label: 'Launches' },
      { to: '/meetings', icon: CalendarCheck, label: 'Meetings' },
      { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
    ],
  },
  {
    heading: 'People & Money',
    items: [
      { to: '/people', icon: Users, label: 'People' },
      { to: '/money', icon: Wallet, label: 'Money' },
    ],
  },
  {
    heading: 'Records',
    items: [{ to: '/library', icon: BookOpen, label: 'Library' }],
  },
  {
    heading: 'Admin',
    items: [
      { to: '/event-day', icon: PartyPopper, label: 'Event Day' },
      { to: '/system', icon: Settings2, label: 'System' },
    ],
  },
];

export default function Sidebar({ className = '', onNavigate, role = 'Member' }: SidebarProps) {
  const mode = getConnectionMode();
  const isSupabase = mode === 'supabase';

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessRoute(role, item.to)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className={`m-3 flex flex-col w-72 glass-shell rounded-[var(--radius-xl)] shrink-0 h-[calc(100%-1.5rem)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-4 h-[4.25rem] border-b border-white/10 shrink-0">
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-300/30 via-blue-500/20 to-cyan-300/10 border border-blue-100/25 flex items-center justify-center shrink-0 shadow-lg shadow-blue-950/40">
          <span className="absolute inset-1 rounded-xl border border-white/10" />
          <Hexagon size={18} className="text-blue-100" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight tracking-normal">RCCS OS</div>
          <div className="text-slate-400 text-xs">Internal Operating System</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-normal text-slate-500/80">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                      isActive
                        ? 'bg-white/10 text-white border-blue-200/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/6 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-blue-300/80" />}
                      <Icon size={16} className={`shrink-0 ${isActive ? 'text-blue-200' : 'opacity-75'}`} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/10 shrink-0">
        <div className={`control-pill min-h-0 py-1 px-2 text-[11px] mb-2 ${isSupabase ? 'text-emerald-300' : 'text-slate-400'}`}>
          {isSupabase ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isSupabase ? 'Supabase Connected' : 'Local Demo Mode'}
        </div>
        <p className="text-[10px] text-slate-600">RCCS OS · Final Phase</p>
      </div>
    </aside>
  );
}
