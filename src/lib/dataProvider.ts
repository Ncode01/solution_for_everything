/**
 * Data Provider Abstraction — Phase Four
 *
 * Selects between:
 *   - localProvider: reads/writes localStorage (Local Demo Mode)
 *   - supabaseProvider: reads/writes Supabase (Supabase Connected)
 *
 * The active provider is chosen based on whether VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set. The app never crashes if Supabase is
 * not configured — it falls back to localStorage silently.
 *
 * Usage:
 *   import { getConnectionMode } from './supabaseClient';
 *   // The AppDataContext already uses localStorage. Supabase reads are
 *   // performed per-page as needed via the supabase client directly.
 *   // This file provides the mode indicator and helper utilities.
 */

import { getConnectionMode, type ConnectionMode } from './supabaseClient';

export { getConnectionMode, type ConnectionMode };

/**
 * Returns a human-readable label for the current connection mode.
 */
export function getConnectionLabel(): string {
  return getConnectionMode() === 'supabase' ? 'Supabase Connected' : 'Local Demo Mode';
}

/**
 * Returns whether the app is in local demo mode.
 */
export function isLocalMode(): boolean {
  return getConnectionMode() === 'local';
}

/**
 * Returns whether the app is connected to Supabase.
 */
export function isSupabaseMode(): boolean {
  return getConnectionMode() === 'supabase';
}
