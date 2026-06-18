import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebaseClient';

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
  localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify([entry, ...existing].slice(0, LOCAL_AUDIT_MAX)));
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

  if (firebaseConfigured && db && auth?.currentUser) {
    try {
      await setDoc(doc(db, 'auditLogs', entry.id), entry);
      return;
    } catch (error) {
      console.warn('[audit] Failed to write Firebase audit log:', error);
    }
  }

  appendLocalAuditEntry(entry);
}

export async function getFirebaseAuditEntries(limit = 300): Promise<AuditEntry[]> {
  if (!firebaseConfigured || !db || !auth?.currentUser) return [];
  const snapshot = await getDocs(collection(db, 'auditLogs'));
  return snapshot.docs
    .map((entry) => entry.data() as AuditEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getLocalAuditEntries(): AuditEntry[] {
  return getLocalAuditLog();
}
