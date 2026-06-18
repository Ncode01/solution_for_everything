import React from 'react';
import { LogOut, Menu, Search, Shield, User as UserIcon, Wifi, WifiOff } from 'lucide-react';
import { User } from '../types';
import { firebaseConfigured } from '../lib/firebaseClient';
import GlobalSearch from './GlobalSearch';
import AttentionBell from './AttentionBell';

interface TopbarProps {
  user: User;
  onLogout: () => void;
  onOpenSidebar: () => void;
  onOpenCommand?: () => void;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  'Super Admin': <Shield size={12} className="text-[var(--accent)]" />,
  'Executive Admin': <Shield size={12} className="text-[var(--success)]" />,
  'Project Admin': <Shield size={12} className="text-[var(--warning)]" />,
  'Team Lead': <UserIcon size={12} className="text-[var(--launch)]" />,
  Member: <UserIcon size={12} className="text-[var(--text-tertiary)]" />,
  Viewer: <UserIcon size={12} className="text-[var(--text-faint)]" />,
};

export default function Topbar({ user, onLogout, onOpenSidebar, onOpenCommand }: TopbarProps) {
  const isFirebase = firebaseConfigured;

  return (
    <header className="relative z-[var(--z-topbar)] flex h-20 shrink-0 items-center gap-3 px-3 sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="apple-button-glass p-2 lg:hidden"
        title="Menu"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="floating-control flex min-w-0 flex-1 items-center gap-2 p-1.5">
        <GlobalSearch />
        {onOpenCommand && (
          <button
            onClick={onOpenCommand}
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text-primary)] md:flex"
            title="Command Menu (Ctrl+K)"
          >
            <Search size={12} />
            <span className="rounded-md border border-[var(--border-subtle)] bg-black/10 px-1.5 py-0.5 text-[10px]">Ctrl K</span>
          </button>
        )}
      </div>

      <AttentionBell />

      <div
        className={`hidden md:flex control-pill min-h-0 py-1 px-2 text-[11px] ${isFirebase ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'}`}
        title={isFirebase ? 'Firebase Connected' : 'Local Demo Mode'}
      >
        {isFirebase ? <Wifi size={11} /> : <WifiOff size={11} />}
      </div>

      <div className="control-pill">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] text-sm font-semibold text-[var(--text-primary)]">
          {user.displayName[0]}
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-medium leading-tight text-[var(--text-primary)]">{user.displayName}</div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            {ROLE_ICON[user.role] ?? <UserIcon size={12} className="text-[var(--text-tertiary)]" />}
            {user.role}
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="apple-button-ghost p-2"
        title="Logout"
        aria-label="Logout"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
