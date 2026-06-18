import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { canAccessRoute, routeBlockedMessage, type NavRoute } from '../lib/navigationAccess';
import Card from './Card';

interface RoleGuardProps {
  route: NavRoute;
  children: React.ReactNode;
}

export default function RoleGuard({ route, children }: RoleGuardProps) {
  const { user, profile } = useAuth();
  const role = profile?.role ?? user?.role ?? 'Member';

  if (canAccessRoute(role, route)) return <>{children}</>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Card className="py-8 text-center space-y-3">
        <p className="text-white font-semibold">Access restricted</p>
        <p className="text-sm text-slate-400">{routeBlockedMessage(route)}</p>
        <p className="text-xs text-slate-600">Your role: {role}</p>
        <Link to="/today" className="btn-secondary inline-flex text-sm mt-2">Back to Today</Link>
      </Card>
    </div>
  );
}
