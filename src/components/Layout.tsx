import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandMenu from './CommandMenu';
import { User } from '../types';
import { useAuth } from '../state/AuthContext';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { profile } = useAuth();
  const role = profile?.role ?? user.role;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-background flex h-screen overflow-hidden">
      <Sidebar className="hidden lg:flex" role={role} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
          <Sidebar className="relative z-10 flex" onNavigate={() => setMobileOpen(false)} role={role} />
        </div>
      )}

      <div className="relative flex flex-col flex-1 min-w-0">
        <Topbar
          user={user}
          onLogout={onLogout}
          onOpenSidebar={() => setMobileOpen(true)}
          onOpenCommand={() => setCmdOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <Outlet />
        </main>
      </div>

      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
