/**
 * Audit logging utility — Phase Five
 *
 * In Supabase mode: inserts into audit_logs table.
 * In local mode: stores in localStorage (capped at 500 entries).
 *
 * Audit failures never break the primary action — errors are console-warned.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'generated'
  | 'imported'
  | 'reset'
  | 'approved'
  | 'rejected'
  | 'converted';

export type AuditEntityType =
  | 'project'
  | 'phase'
  | 'milestone'
  | 'task'
  | 'pr_item'
  | 'meeting'
  | 'action_item'
  | 'sponsor'
  | 'transaction'
  | 'approval'
  | 'report'
  | 'file_link'
  | 'member'
  | 'data';

export interface AuditEntry {
  id: string;
  actorProfileId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  projectId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const LOCAL_AUDIT_KEY = 'rccs_audit_log';
const LOCAL_AUDIT_MAX = 500;

function getLocalAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function appendLocalAuditEntry(entry: AuditEntry): void {
  const existing = getLocalAuditLog();
  const next = [entry, ...existing].slice(0, LOCAL_AUDIT_MAX);
  localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(next));
}

export async function logAudit(params: {
  actorProfileId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  projectId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    actorProfileId: params.actorProfileId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    projectId: params.projectId ?? null,
    summary: params.summary,
    metadata: params.metadata ?? {},
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('audit_logs') as any).insert({
      actor_profile_id: entry.actorProfileId,
      action:           entry.action,
      entity_type:      entry.entityType,
      entity_id:        entry.entityId,
      project_id:       entry.projectId,
      summary:          entry.summary,
      metadata:         entry.metadata,
    });
    if (error) {
      console.warn('[audit] Failed to write audit log:', error.message);
      // Fallback to local so the log isn't entirely lost
      appendLocalAuditEntry(entry);
    }
  } else {
    appendLocalAuditEntry(entry);
  }
}

/** Read audit log entries — local mode only (Supabase queries via UI). */
export function getLocalAuditEntries(): AuditEntry[] {
  return getLocalAuditLog();
}
