// ============================================================
// TEMPORARY MVP AUTH — NOT PRODUCTION SECURITY
// This is hardcoded username/password auth for Phase One demo.
// MUST be replaced with proper auth (Firebase Auth or similar)
// before any real deployment or when storing sensitive data.
// Passwords are stored in plaintext here intentionally for MVP.
// ============================================================

import { User } from '../types';

const SESSION_KEY = 'rccs_session';

const USERS: (User & { password: string })[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    displayName: 'RCCS Admin',
    role: 'Super Admin',
  },
  {
    id: 'user-secretary',
    username: 'secretary',
    password: 'rccs2026',
    displayName: 'RCCS Secretary',
    role: 'Executive Admin',
  },
  {
    id: 'user-member',
    username: 'member',
    password: 'member123',
    displayName: 'RCCS Member',
    role: 'Member',
  },
];

export function login(username: string, password: string): User | null {
  const found = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!found) return null;
  const session: User = {
    id: found.id,
    username: found.username,
    displayName: found.displayName,
    role: found.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
