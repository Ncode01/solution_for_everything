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

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const NAV_GROUPS: { heading: string; items: { to: string; icon: React.ElementType; label: string }[] }[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/today',    icon: Sun,          label: 'Today' },
      { to: '/focus',    icon: Crosshair,    label: 'Focus' },
      { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/launches',   icon: Rocket,       label: 'Launches' },
      { to: '/meetings',   icon: CalendarCheck, label: 'Meetings' },
      { to: '/approvals',  icon: CheckSquare,  label: 'Approvals' },
    ],
  },
  {
    heading: 'People & Money',
    items: [
      { to: '/people', icon: Users,  label: 'People' },
      { to: '/money',  icon: Wallet, label: 'Money' },
    ],
  },
  {
    heading: 'Records',
    items: [
      { to: '/library', icon: BookOpen, label: 'Library' },
    ],
  },
  {
    heading: 'Admin',
    items: [
      { to: '/event-day', icon: PartyPopper, label: 'Event Day' },
      { to: '/system',    icon: Settings2,   label: 'System' },
    ],
  },
];

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const mode = getConnectionMode();
  const isSupabase = mode === 'supabase';

  return (
    <aside className={`flex flex-col w-64 bg-slate-950 border-r border-slate-800/70 shrink-0 h-full ${className}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/70 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
          <Hexagon size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight tracking-tight">RCCS OS</div>
          <div className="text-slate-500 text-xs">Internal Operating System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — connection mode */}
      <div className="px-4 py-3 border-t border-slate-800/70 shrink-0">
        <div className={`flex items-center gap-1.5 text-xs mb-1 ${isSupabase ? 'text-emerald-400' : 'text-slate-500'}`}>
          {isSupabase ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isSupabase ? 'Supabase Connected' : 'Local Demo Mode'}
        </div>
        <p className="text-[10px] text-slate-700">Phase Six · RCCS OS v6.0.0</p>
      </div>
    </aside>
  );
}
