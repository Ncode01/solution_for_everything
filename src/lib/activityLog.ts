/**
 * Activity Timeline — human-readable activity logging.
 * Failures never break primary mutations.
 */

import { ActivityItem, ActivityItemType } from '../types';
import { generateId } from './dateUtils';
import { syncActivityToSupabase } from './supabaseActivity';

export function createActivityItem(
  type: ActivityItemType,
  summary: string,
  opts?: {
    projectId?: string;
    actorId?: string;
    actorName?: string;
    relatedType?: string;
    relatedId?: string;
    link?: string;
  },
): ActivityItem {
  return {
    id: generateId(),
    type,
    summary,
    actorId: opts?.actorId,
    actorName: opts?.actorName ?? 'Someone',
    projectId: opts?.projectId,
    relatedType: opts?.relatedType,
    relatedId: opts?.relatedId,
    link: opts?.link,
    createdAt: new Date().toISOString(),
  };
}

export function logActivityItem(item: ActivityItem): void {
  syncActivityToSupabase(item).catch((e) => console.warn('[activity supabase]', e));
}
