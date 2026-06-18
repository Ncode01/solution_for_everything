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
import { getConnectionMode } from '../lib/firebaseClient';
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
  const isFirebase = mode === 'firebase';

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessRoute(role, item.to)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className={`m-3 flex h-[calc(100%-1.5rem)] w-[17rem] shrink-0 flex-col overflow-hidden rounded-[var(--radius-2xl)] glass-shell ${className}`}>
      <div className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-[var(--border-hairline)] px-4">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(82,119,255,0.08))]">
          <span className="absolute inset-1 rounded-[14px] border border-white/10" />
          <Hexagon size={17} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-[var(--text-primary)]">RCCS OS</div>
          <div className="text-xs text-[var(--text-tertiary)]">Internal Operating System</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.heading}>
            <p className="mb-2 px-3 text-[11px] font-medium text-[var(--text-faint)]">{group.heading}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-full border px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'border-[var(--border-glass)] bg-[var(--surface-glass-strong)] text-[var(--text-primary)] shadow-[var(--shadow-inner-highlight)]'
                        : 'border-transparent text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--royal)]" />}
                      <Icon size={16} className={`shrink-0 ${isActive ? 'text-[var(--accent)]' : 'opacity-75'}`} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--border-hairline)] px-4 py-3">
        <div className={`mb-2 inline-flex min-h-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] ${isFirebase ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'}`}>
          <span className={`h-2 w-2 rounded-full ${isFirebase ? 'bg-[var(--success)]' : 'bg-[var(--text-faint)]'}`} />
          {isFirebase ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isFirebase ? 'Firebase Connected' : 'Local Demo Mode'}
        </div>
        <p className="text-[10px] text-[var(--text-faint)]">RCCS OS · Final Phase</p>
      </div>
    </aside>
  );
}
