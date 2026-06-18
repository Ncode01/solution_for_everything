import React, { useState } from 'react';
import { ChevronRight, AlertCircle, Wifi, WifiOff, UserX } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';
import { firebaseConfigured } from '../../lib/firebaseClient';

export default function LoginPage() {
  const { login, logout, state, session } = useAuth();
  const isFirebase = firebaseConfigured;

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Profile not found ──────────────────────────────────────────────────────
  if (state === 'no-profile') {
    return (
      <div className="app-background min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center mx-auto mb-4">
              <UserX size={28} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Profile Not Linked</h1>
            <p className="text-slate-500 text-sm mt-1">Your account is not linked to an RCCS profile.</p>
          </div>

          <div className="solid-panel p-4 space-y-2 text-sm">
            <p className="text-slate-300 font-medium">Logged in as:</p>
            <p className="text-slate-500 font-mono text-xs">{session?.user?.email ?? 'Unknown'}</p>
            <div className="border-t border-slate-800 pt-3 mt-2 text-slate-500 text-xs space-y-1">
              <p>An RCCS administrator needs to:</p>
              <p>1. Create your People profile in RCCS OS.</p>
              <p>2. Set <code className="text-slate-400">authUserId</code> or matching email on that person.</p>
              <p className="font-mono text-[10px] text-slate-600 break-all">{session?.user?.uid}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="btn-secondary w-full justify-center"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await login(credential, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="app-background min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 rounded-3xl glass-panel-strong flex items-center justify-center mx-auto mb-4">
            <span className="absolute inset-2 rounded-2xl border border-white/10" />
            <ChevronRight size={28} className="text-blue-100" />
          </div>
          <h1 className="text-2xl font-bold text-white">RCCS OS</h1>
          <p className="text-slate-500 text-sm mt-1">Internal Operating System</p>
        </div>

        {/* Mode badge */}
        <div className={`flex items-center justify-center gap-1.5 text-xs mb-4 ${isFirebase ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isFirebase ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isFirebase ? 'Firebase Connected' : 'Local Demo Mode'}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-panel-strong rounded-[var(--radius-xl)] p-4 space-y-4">
          <div>
            <label className="label" htmlFor="credential">
              {isFirebase ? 'Email' : 'Username'}
            </label>
            <input
              id="credential"
              type={isFirebase ? 'email' : 'text'}
              className="input"
              placeholder={isFirebase ? 'you@rccs.lk' : 'Enter your username'}
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              autoComplete={isFirebase ? 'email' : 'username'}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials — only shown in local mode */}
        {!isFirebase && (
          <div className="mt-4 solid-panel p-4 text-xs space-y-1">
            <p className="text-slate-500 font-medium mb-2">Demo Credentials</p>
            <p className="text-slate-400"><span className="text-slate-300">admin</span> / admin123 — Super Admin</p>
            <p className="text-slate-400"><span className="text-slate-300">secretary</span> / rccs2026 — Executive Admin</p>
            <p className="text-slate-400"><span className="text-slate-300">member</span> / member123 — Member</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-700 mt-4">
          {isFirebase
            ? 'Use your Firebase Auth email and password.'
            : 'Local Demo Mode — data stored in browser only.'}
        </p>
      </div>
    </div>
  );
}
