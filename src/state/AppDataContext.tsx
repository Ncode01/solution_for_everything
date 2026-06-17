import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  AppData,
  Project,
  Member,
  Meeting,
  Sponsor,
  Budget,
  Transaction,
  ApprovalRequest,
  FileLink,
  Report,
  Deliverable,
  EventDayItem,
  ActivityItem,
} from '../types';
import { loadAppData, saveAppData } from '../lib/storage';
import { logAudit } from '../lib/audit';

interface Identifiable {
  id: string;
}

function upsert<T extends Identifiable>(arr: T[], item: T): T[] {
  return arr.some((x) => x.id === item.id)
    ? arr.map((x) => (x.id === item.id ? item : x))
    : [...arr, item];
}

function remove<T extends Identifiable>(arr: T[], id: string): T[] {
  return arr.filter((x) => x.id !== id);
}

/** Retrieve the current actor profile id from AuthContext if available. */
function getActorId(): string | null {
  try {
    // We read from a module-level variable set by AppDataProvider
    return (window as unknown as { __rccs_actor_id?: string }).__rccs_actor_id ?? null;
  } catch {
    return null;
  }
}

interface AppDataContextValue {
  data: AppData;
  replaceAll: (next: AppData) => void;
  /** Set the actor profile id used by audit logs (called by AuthContext consumer). */
  setActorId: (id: string | null) => void;

  saveProject: (p: Project) => void;
  deleteProject: (id: string) => void;

  saveMember: (m: Member) => void;
  deleteMember: (id: string) => void;

  saveMeeting: (m: Meeting) => void;
  deleteMeeting: (id: string) => void;

  saveSponsor: (s: Sponsor) => void;
  deleteSponsor: (id: string) => void;

  saveBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;

  saveTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;

  saveApproval: (a: ApprovalRequest) => void;
  deleteApproval: (id: string) => void;

  saveFileLink: (f: FileLink) => void;
  deleteFileLink: (id: string) => void;

  saveReport: (r: Report) => void;
  deleteReport: (id: string) => void;

  saveDeliverable: (d: Deliverable) => void;
  deleteDeliverable: (id: string) => void;

  saveEventDayItem: (e: EventDayItem) => void;
  deleteEventDayItem: (id: string) => void;

  addActivity: (a: ActivityItem) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadAppData);
  const dataRef = useRef(data);
  dataRef.current = data;

  const persist = useCallback((next: AppData) => {
    setData(next);
    saveAppData(next);
  }, []);

  const patch = useCallback(
    (partial: Partial<AppData>) => {
      persist({ ...dataRef.current, ...partial });
    },
    [persist]
  );

  // Helper: fire-and-forget audit log (never throws)
  const audit = useCallback((
    action: Parameters<typeof logAudit>[0]['action'],
    entityType: Parameters<typeof logAudit>[0]['entityType'],
    summary: string,
    extra?: { entityId?: string; projectId?: string },
  ) => {
    logAudit({
      actorProfileId: getActorId(),
      action,
      entityType,
      summary,
      entityId: extra?.entityId,
      projectId: extra?.projectId,
    }).catch((e) => console.warn('[audit]', e));
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      replaceAll: (next) => persist(next),
      setActorId: (id) => {
        (window as unknown as { __rccs_actor_id?: string | null }).__rccs_actor_id = id;
      },

      saveProject: (p) => {
        const isNew = !dataRef.current.projects.some((x) => x.id === p.id);
        patch({ projects: upsert(dataRef.current.projects, p) });
        audit(isNew ? 'created' : 'updated', 'project', `${isNew ? 'Created' : 'Updated'} project: ${p.name}`, { entityId: p.id });
      },
      deleteProject: (id) => {
        const p = dataRef.current.projects.find((x) => x.id === id);
        patch({ projects: remove(dataRef.current.projects, id) });
        audit('deleted', 'project', `Deleted project: ${p?.name ?? id}`, { entityId: id });
      },

      saveMember: (m) => {
        const isNew = !dataRef.current.members.some((x) => x.id === m.id);
        patch({ members: upsert(dataRef.current.members, m) });
        audit(isNew ? 'created' : 'updated', 'member', `${isNew ? 'Added' : 'Updated'} member: ${m.displayName}`, { entityId: m.id });
      },
      deleteMember: (id) => {
        const m = dataRef.current.members.find((x) => x.id === id);
        patch({ members: remove(dataRef.current.members, id) });
        audit('deleted', 'member', `Removed member: ${m?.displayName ?? id}`, { entityId: id });
      },

      saveMeeting: (m) => {
        const isNew = !dataRef.current.meetings.some((x) => x.id === m.id);
        patch({ meetings: upsert(dataRef.current.meetings, m) });
        audit(isNew ? 'created' : 'updated', 'meeting', `${isNew ? 'Scheduled' : 'Updated'} meeting: ${m.title}`, { entityId: m.id, projectId: m.projectId });
      },
      deleteMeeting: (id) => {
        const m = dataRef.current.meetings.find((x) => x.id === id);
        patch({ meetings: remove(dataRef.current.meetings, id) });
        audit('deleted', 'meeting', `Deleted meeting: ${m?.title ?? id}`, { entityId: id });
      },

      saveSponsor: (s) => {
        const isNew = !dataRef.current.sponsors.some((x) => x.id === s.id);
        patch({ sponsors: upsert(dataRef.current.sponsors, s) });
        audit(isNew ? 'created' : 'updated', 'sponsor', `${isNew ? 'Added' : 'Updated'} sponsor: ${s.name}`, { entityId: s.id, projectId: s.projectId });
      },
      deleteSponsor: (id) => {
        const s = dataRef.current.sponsors.find((x) => x.id === id);
        patch({ sponsors: remove(dataRef.current.sponsors, id) });
        audit('deleted', 'sponsor', `Removed sponsor: ${s?.name ?? id}`, { entityId: id });
      },

      saveBudget: (b) => {
        patch({ budgets: upsert(dataRef.current.budgets, b) });
        audit('updated', 'data', 'Updated budget settings', { entityId: b.id, projectId: b.projectId });
      },
      deleteBudget: (id) => {
        patch({ budgets: remove(dataRef.current.budgets, id) });
      },

      saveTransaction: (t) => {
        const isNew = !dataRef.current.transactions.some((x) => x.id === t.id);
        patch({ transactions: upsert(dataRef.current.transactions, t) });
        audit(isNew ? 'created' : 'updated', 'transaction', `${isNew ? 'Recorded' : 'Updated'} transaction: ${t.category} (${t.type})`, { entityId: t.id, projectId: t.projectId });
      },
      deleteTransaction: (id) => {
        const t = dataRef.current.transactions.find((x) => x.id === id);
        patch({ transactions: remove(dataRef.current.transactions, id) });
        audit('deleted', 'transaction', `Deleted transaction: ${t?.category ?? id}`, { entityId: id });
      },

      saveApproval: (a) => {
        const isNew = !dataRef.current.approvals.some((x) => x.id === a.id);
        patch({ approvals: upsert(dataRef.current.approvals, a) });
        const action = a.status === 'Approved' ? 'approved' : a.status === 'Rejected' ? 'rejected' : isNew ? 'created' : 'updated';
        audit(action, 'approval', `${action.charAt(0).toUpperCase() + action.slice(1)} approval: ${a.title}`, { entityId: a.id, projectId: a.projectId ?? undefined });
      },
      deleteApproval: (id) => {
        patch({ approvals: remove(dataRef.current.approvals, id) });
        audit('deleted', 'approval', `Deleted approval request`, { entityId: id });
      },

      saveFileLink: (f) => {
        const isNew = !dataRef.current.fileLinks.some((x) => x.id === f.id);
        patch({ fileLinks: upsert(dataRef.current.fileLinks, f) });
        audit(isNew ? 'created' : 'updated', 'file_link', `${isNew ? 'Added' : 'Updated'} file link: ${f.title}`, { entityId: f.id, projectId: f.projectId });
      },
      deleteFileLink: (id) => {
        patch({ fileLinks: remove(dataRef.current.fileLinks, id) });
        audit('deleted', 'file_link', `Removed file link`, { entityId: id });
      },

      saveReport: (r) => {
        const isNew = !dataRef.current.reports.some((x) => x.id === r.id);
        patch({ reports: upsert(dataRef.current.reports, r) });
        audit(isNew ? 'generated' : 'updated', 'report', `${isNew ? 'Generated' : 'Updated'} report: ${r.title}`, { entityId: r.id, projectId: r.projectId });
      },
      deleteReport: (id) => {
        patch({ reports: remove(dataRef.current.reports, id) });
        audit('deleted', 'report', `Deleted report`, { entityId: id });
      },

      saveDeliverable: (d) => {
        const isNew = !dataRef.current.deliverables.some((x) => x.id === d.id);
        patch({ deliverables: upsert(dataRef.current.deliverables ?? [], d) });
        audit(isNew ? 'created' : 'updated', 'data', `${isNew ? 'Created' : 'Updated'} deliverable: ${d.title}`, { entityId: d.id, projectId: d.projectId });
      },
      deleteDeliverable: (id) => {
        patch({ deliverables: remove(dataRef.current.deliverables ?? [], id) });
        audit('deleted', 'data', `Deleted deliverable`, { entityId: id });
      },

      saveEventDayItem: (e) => {
        const isNew = !dataRef.current.eventDayItems.some((x) => x.id === e.id);
        patch({ eventDayItems: upsert(dataRef.current.eventDayItems ?? [], e) });
        if (!isNew) audit('updated', 'data', `Event-day item updated: ${e.title}`, { entityId: e.id, projectId: e.projectId });
      },
      deleteEventDayItem: (id) => {
        patch({ eventDayItems: remove(dataRef.current.eventDayItems ?? [], id) });
      },

      addActivity: (a) => {
        const items = dataRef.current.activityItems ?? [];
        // Keep a rolling 200-item activity log
        const trimmed = items.length >= 200 ? items.slice(-199) : items;
        patch({ activityItems: [...trimmed, a] });
      },
    }),
    [data, patch, persist, audit]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
