/**
 * Supabase client — initialized only when env vars are present.
 * If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing,
 * supabase is null and the app falls back to localStorage (Local Demo Mode).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== 'your-anon-key-here';

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;

export type ConnectionMode = 'local' | 'supabase';

export function getConnectionMode(): ConnectionMode {
  return isSupabaseConfigured ? 'supabase' : 'local';
}
