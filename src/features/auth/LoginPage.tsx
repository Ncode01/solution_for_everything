import React, { useState } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { login } from '../../lib/auth';
import { User } from '../../types';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 300);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <ChevronRight size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RCCS Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">Royal College Computer Society</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 card text-xs space-y-1">
          <p className="text-slate-500 font-medium mb-2">Demo Credentials</p>
          <p className="text-slate-400"><span className="text-slate-300">admin</span> / admin123 — Super Admin</p>
          <p className="text-slate-400"><span className="text-slate-300">secretary</span> / rccs2026 — Executive Admin</p>
          <p className="text-slate-400"><span className="text-slate-300">member</span> / member123 — Member</p>
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">
          Phase One MVP · Local demo only
        </p>
      </div>
    </div>
  );
}
