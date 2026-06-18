import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { login as localLogin, logout as localLogout, getSession as getLocalSession } from '../lib/auth';
import { auth, firebaseConfigured } from '../lib/firebaseClient';
import { loadAppData } from '../lib/storage';
import { loadFirebaseAppData } from '../lib/firebaseDataProvider';
import { roleToUserRole } from '../lib/people';
import type { Member, User, UserRole } from '../types';

export interface AuthProfile {
  id: string;
  displayName: string;
  role: UserRole | string;
  email: string | null;
  username: string | null;
  committee: string | null;
  authUserId: string | null;
}

export interface AuthSession {
  user: {
    id: string;
    uid: string;
    email: string | null;
  };
}

export type AuthState = 'loading' | 'unauthenticated' | 'no-profile' | 'authenticated';

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isFirebaseMode: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileFromMember(member: Member): AuthProfile {
  return {
    id: member.id,
    displayName: member.displayName,
    role: roleToUserRole(member.role),
    email: member.email ?? null,
    username: member.username ?? null,
    committee: member.committee ?? null,
    authUserId: member.authUserId ?? null,
  };
}

async function resolveFirebaseMember(firebaseUser: FirebaseUser): Promise<Member | null> {
  const localMembers = loadAppData().members;
  const localMatch = localMembers.find((member) =>
    member.authUserId === firebaseUser.uid ||
    (!!firebaseUser.email && !!member.email && member.email.toLowerCase() === firebaseUser.email.toLowerCase())
  );
  if (localMatch) return localMatch;

  try {
    const remote = await loadFirebaseAppData();
    return remote.members.find((member) =>
      member.authUserId === firebaseUser.uid ||
      (!!firebaseUser.email && !!member.email && member.email.toLowerCase() === firebaseUser.email.toLowerCase())
    ) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setState('unauthenticated');
        return;
      }

      setSession({
        user: {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        },
      });

      const member = await resolveFirebaseMember(firebaseUser);
      if (!member) {
        setUser(null);
        setProfile(null);
        setState('no-profile');
        return;
      }

      const nextProfile = profileFromMember(member);
      setProfile(nextProfile);
      setUser({
        id: nextProfile.id,
        username: nextProfile.username ?? nextProfile.email ?? nextProfile.id,
        displayName: nextProfile.displayName,
        role: (nextProfile.role as UserRole) ?? 'Member',
      });
      setState('authenticated');
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    if (!firebaseConfigured || !auth) {
      const localUser = localLogin(emailOrUsername, password);
      if (!localUser) return { error: 'Invalid username or password.' };

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
      return { error: null };
    }

    try {
      await signInWithEmailAndPassword(auth, emailOrUsername, password);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not sign in.' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (firebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localLogout();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    setState('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        state,
        user,
        profile,
        session,
        isFirebaseMode: firebaseConfigured,
        isLoading: state === 'loading',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
