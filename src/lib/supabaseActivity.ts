/**
 * Sync activity_items to Supabase when connected.
 * Local mode: no-op (activity lives in localStorage via AppDataContext).
 */

import { ActivityItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export async function syncActivityToSupabase(item: ActivityItem): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await (supabase.from('activity_items') as any).insert({
    id: item.id,
    project_id: item.projectId ?? null,
    actor_id: item.actorId ?? null,
    type: item.type,
    summary: item.summary,
    related_type: item.relatedType ?? null,
    related_id: item.relatedId ?? null,
    created_at: item.createdAt,
  });

  if (error) throw error;
}

interface ActivityRow {
  id: string;
  project_id: string | null;
  actor_id: string | null;
  type: string;
  summary: string;
  related_type: string | null;
  related_id: string | null;
  created_at: string;
}

export async function fetchActivityFromSupabase(limit = 200): Promise<ActivityItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('activity_items')
    .select('id, project_id, actor_id, type, summary, related_type, related_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as ActivityRow[]).map((row) => ({
    id: row.id,
    projectId: row.project_id ?? undefined,
    actorId: row.actor_id ?? undefined,
    type: row.type as ActivityItem['type'],
    summary: row.summary,
    relatedType: row.related_type ?? undefined,
    relatedId: row.related_id ?? undefined,
    createdAt: row.created_at,
  }));
}
