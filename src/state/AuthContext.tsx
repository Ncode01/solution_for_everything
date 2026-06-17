/**
 * AuthContext — Phase Five
 *
 * Handles two modes:
 *   - Supabase mode (VITE_SUPABASE_URL configured): uses supabase.auth.*
 *   - Local Demo mode (no env vars): uses hardcoded credentials from src/lib/auth.ts
 *
 * Components consume: user, profile, session, isLoading, isSupabaseMode, login, logout, role
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { login as localLogin, logout as localLogout, getSession as getLocalSession } from '../lib/auth';
import type { User, UserRole } from '../types';

export interface AuthProfile {
  id: string;
  displayName: string;
  role: UserRole | string;
  email: string | null;
  username: string | null;
  committee: string | null;
  authUserId: string | null;
}

export type AuthState =
  | 'loading'
  | 'unauthenticated'
  | 'no-profile'   // authenticated but profiles.auth_user_id not linked
  | 'authenticated';

interface AuthContextValue {
  state: AuthState;
  user: User | null;          // legacy local-compat shape
  profile: AuthProfile | null;
  session: Session | null;
  isSupabaseMode: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // ── Supabase mode ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (authUserId: string): Promise<AuthProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role, email, username, committee, auth_user_id')
      .eq('auth_user_id', authUserId)
      .maybeSingle() as {
        data: {
          id: string;
          display_name: string;
          role: string;
          email: string | null;
          username: string | null;
          committee: string | null;
          auth_user_id: string | null;
        } | null;
        error: unknown;
      };
    if (error || !data) return null;
    return {
      id: data.id,
      displayName: data.display_name,
      role: data.role as UserRole,
      email: data.email ?? null,
      username: data.username ?? null,
      committee: data.committee ?? null,
      authUserId: data.auth_user_id ?? null,
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Local demo mode — restore from localStorage
      const localUser = getLocalSession();
      if (localUser) {
        setUser(localUser);
        setProfile({
          id: localUser.id,
          displayName: localUser.displayName,
          role: localUser.role,
          email: null,
          username: localUser.username,
          committee: null,
          authUserId: null,
        });
        setState('authenticated');
      } else {
        setState('unauthenticated');
      }
      return;
    }

    // Supabase mode — get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (!s) {
        setState('unauthenticated');
        return;
      }
      const p = await fetchProfile(s.user.id);
      if (!p) {
        setState('no-profile');
        return;
      }
      setProfile(p);
      setUser({
        id: p.id,
        username: p.username ?? p.email ?? p.id,
        displayName: p.displayName,
        role: (p.role as UserRole) ?? 'Member',
      });
      setState('authenticated');
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (!s) {
        setUser(null);
        setProfile(null);
        setState('unauthenticated');
        return;
      }
      const p = await fetchProfile(s.user.id);
      if (!p) {
        setUser(null);
        setProfile(null);
        setState('no-profile');
        return;
      }
      setProfile(p);
      setUser({
        id: p.id,
        username: p.username ?? p.email ?? p.id,
        displayName: p.displayName,
        role: (p.role as UserRole) ?? 'Member',
      });
      setState('authenticated');
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (
    emailOrUsername: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) {
      // Local demo mode
      const u = localLogin(emailOrUsername, password);
      if (!u) return { error: 'Invalid username or password.' };
      setUser(u);
      setProfile({
        id: u.id,
        displayName: u.displayName,
        role: u.role,
        email: null,
        username: u.username,
        committee: null,
        authUserId: null,
      });
      setState('authenticated');
      return { error: null };
    }

    // Supabase mode — email required
    const { error } = await supabase.auth.signInWithPassword({
      email: emailOrUsername,
      password,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localLogout();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    setState('unauthenticated');
  }, []);

  const value: AuthContextValue = {
    state,
    user,
    profile,
    session,
    isSupabaseMode: isSupabaseConfigured,
    isLoading: state === 'loading',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
