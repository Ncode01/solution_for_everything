import React from 'react';
import { LogOut, Menu, Search, Shield, User as UserIcon, Wifi, WifiOff } from 'lucide-react';
import { User } from '../types';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import GlobalSearch from './GlobalSearch';
import AttentionBell from './AttentionBell';

interface TopbarProps {
  user: User;
  onLogout: () => void;
  onOpenSidebar: () => void;
  onOpenCommand?: () => void;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  'Super Admin': <Shield size={12} className="text-blue-300" />,
  'Executive Admin': <Shield size={12} className="text-emerald-300" />,
  'Project Admin': <Shield size={12} className="text-amber-300" />,
  'Team Lead': <UserIcon size={12} className="text-violet-300" />,
  Member: <UserIcon size={12} className="text-slate-400" />,
  Viewer: <UserIcon size={12} className="text-slate-500" />,
};

export default function Topbar({ user, onLogout, onOpenSidebar, onOpenCommand }: TopbarProps) {
  const isSupabase = isSupabaseConfigured;

  return (
    <header className="relative z-[var(--z-topbar)] h-20 flex items-center gap-3 px-3 sm:px-6 shrink-0">
      <button
        onClick={onOpenSidebar}
        className="apple-button-glass p-2 lg:hidden"
        title="Menu"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="floating-control flex-1 min-w-0 flex items-center gap-2 p-1.5">
        <GlobalSearch />
        {onOpenCommand && (
          <button
            onClick={onOpenCommand}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10 shrink-0"
            title="Command Menu (Ctrl+K)"
          >
            <Search size={12} />
            <span>Ctrl+K</span>
          </button>
        )}
      </div>

      <AttentionBell />

      <div
        className={`hidden md:flex control-pill min-h-0 py-1 px-2 text-[11px] ${isSupabase ? 'text-emerald-300' : 'text-slate-500'}`}
        title={isSupabase ? 'Supabase Connected' : 'Local Demo Mode'}
      >
        {isSupabase ? <Wifi size={11} /> : <WifiOff size={11} />}
      </div>

      <div className="control-pill">
        <div className="w-7 h-7 rounded-full bg-blue-400/15 border border-blue-200/20 flex items-center justify-center text-blue-100 text-sm font-semibold shrink-0">
          {user.displayName[0]}
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-medium text-white leading-tight">{user.displayName}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {ROLE_ICON[user.role] ?? <UserIcon size={12} className="text-slate-400" />}
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
