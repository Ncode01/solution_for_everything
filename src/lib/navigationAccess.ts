/**
 * Role-aware navigation — UX only, not security.
 * Firestore rules handle actual data access in Firebase mode.
 */

import { UserRole } from '../types';

export type NavRoute =
  | '/today'
  | '/focus'
  | '/calendar'
  | '/projects'
  | '/launches'
  | '/meetings'
  | '/approvals'
  | '/people'
  | '/money'
  | '/library'
  | '/system'
  | '/event-day';

const ALL_ROUTES: NavRoute[] = [
  '/today', '/focus', '/calendar', '/projects', '/launches', '/meetings',
  '/approvals', '/people', '/money', '/library', '/system', '/event-day',
];

const ADMIN_ROLES: UserRole[] = ['Super Admin', 'Executive Admin'];
const MANAGER_ROLES: UserRole[] = [...ADMIN_ROLES, 'Project Admin', 'Team Lead'];

export function canAccessRoute(role: UserRole | string, route: NavRoute): boolean {
  if (ADMIN_ROLES.includes(role as UserRole)) return true;

  if (MANAGER_ROLES.includes(role as UserRole)) {
    if (route === '/system') return false;
    return true;
  }

  if (role === 'Member') {
    return !['/people', '/money', '/system'].includes(route);
  }

  // Viewer / Teacher
  if (role === 'Viewer') {
    return ['/today', '/projects', '/calendar', '/approvals', '/library'].includes(route);
  }

  return ALL_ROUTES.includes(route);
}

export function getVisibleRoutes(role: UserRole | string): NavRoute[] {
  return ALL_ROUTES.filter((r) => canAccessRoute(role, r));
}

export function routeBlockedMessage(route: NavRoute): string {
  const labels: Record<NavRoute, string> = {
    '/today': 'Today',
    '/focus': 'Focus',
    '/calendar': 'Calendar',
    '/projects': 'Projects',
    '/launches': 'Launches',
    '/meetings': 'Meetings',
    '/approvals': 'Approvals',
    '/people': 'People',
    '/money': 'Money',
    '/library': 'Library',
    '/system': 'System',
    '/event-day': 'Event Day',
  };
  return `${labels[route]} is not available for your role. Contact an RCCS admin if you need access.`;
}
