import React from 'react';
import { Menu, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import GlobalSearch from './GlobalSearch';
import AttentionBell from './AttentionBell';

interface TopbarProps {
  user: User;
  onLogout: () => void;
  onOpenSidebar: () => void;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  'Super Admin': <Shield size={12} className="text-blue-400" />,
  'Executive Admin': <Shield size={12} className="text-emerald-400" />,
  Member: <UserIcon size={12} className="text-slate-400" />,
};

export default function Topbar({ user, onLogout, onOpenSidebar }: TopbarProps) {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center gap-3 px-3 sm:px-4 shrink-0">
      <button
        onClick={onOpenSidebar}
        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
        title="Menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <GlobalSearch />
      </div>

      <AttentionBell />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          {user.displayName[0]}
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-medium text-white leading-tight">{user.displayName}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {ROLE_ICON[user.role]}
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
