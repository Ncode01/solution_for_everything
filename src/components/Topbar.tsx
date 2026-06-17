import React from 'react';
import { Menu, LogOut, Shield, User as UserIcon, Wifi, WifiOff, Search } from 'lucide-react';
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
  'Super Admin':     <Shield size={12} className="text-blue-400" />,
  'Executive Admin': <Shield size={12} className="text-emerald-400" />,
  'Project Admin':   <Shield size={12} className="text-amber-400" />,
  'Team Lead':       <UserIcon size={12} className="text-violet-400" />,
  Member:            <UserIcon size={12} className="text-slate-400" />,
  Viewer:            <UserIcon size={12} className="text-slate-600" />,
};

export default function Topbar({ user, onLogout, onOpenSidebar, onOpenCommand }: TopbarProps) {
  const isSupabase = isSupabaseConfigured;

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800/70 flex items-center gap-3 px-3 sm:px-4 shrink-0">
      <button
        onClick={onOpenSidebar}
        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
        title="Menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <GlobalSearch />
        {onOpenCommand && (
          <button
            onClick={onOpenCommand}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors border border-slate-800 shrink-0"
            title="Command Menu (Ctrl+K)"
          >
            <Search size={12} />
            <span>Ctrl+K</span>
          </button>
        )}
      </div>

      <AttentionBell />

      {/* Connection badge — subtle, desktop only */}
      <div className={`hidden md:flex items-center gap-1 text-xs ${isSupabase ? 'text-emerald-500' : 'text-slate-600'}`} title={isSupabase ? 'Supabase Connected' : 'Local Demo Mode'}>
        {isSupabase ? <Wifi size={11} /> : <WifiOff size={11} />}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Logout"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
}
