import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
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
import { createActivityItem, logActivityItem } from '../lib/activityLog';
import { formatCurrency } from '../lib/dateUtils';

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

function getActor(): { id: string | null; name: string } {
  try {
    const w = window as unknown as { __rccs_actor_id?: string; __rccs_actor_name?: string };
    return { id: w.__rccs_actor_id ?? null, name: w.__rccs_actor_name ?? 'Someone' };
  } catch {
    return { id: null, name: 'Someone' };
  }
}

interface AppDataContextValue {
  data: AppData;
  replaceAll: (next: AppData) => void;
  setActorId: (id: string | null) => void;
  setActorName: (name: string | null) => void;

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

function pushActivity(
  addFn: (a: ActivityItem) => void,
  type: ActivityItem['type'],
  summary: string,
  opts?: { projectId?: string; relatedType?: string; relatedId?: string; link?: string },
) {
  try {
    const actor = getActor();
    const item = createActivityItem(type, summary, { ...opts, actorId: actor.id ?? undefined, actorName: actor.name });
    addFn(item);
    logActivityItem(item);
  } catch (e) {
    console.warn('[activity]', e);
  }
}

function logProjectNestedChanges(
  addFn: (a: ActivityItem) => void,
  prev: Project | undefined,
  next: Project,
) {
  const actor = getActor();
  const who = actor.name;

  if (!prev) {
    pushActivity(addFn, 'project_created', `${who} created project "${next.name}".`, { projectId: next.id, link: `/projects/${next.id}` });
    return;
  }

  if (prev.name !== next.name || prev.status !== next.status) {
    pushActivity(addFn, 'project_updated', `${who} updated project "${next.name}".`, { projectId: next.id, link: `/projects/${next.id}` });
  }

  // Tasks
  next.tasks.forEach((t) => {
    const old = prev.tasks.find((x) => x.id === t.id);
    if (!old) {
      pushActivity(addFn, 'task_created', `${who} created task "${t.title}" in ${next.name}.`, { projectId: next.id, relatedId: t.id, link: `/projects/${next.id}` });
    } else if (old.status !== t.status) {
      if (t.status === 'Done' || t.status === 'Approved') {
        pushActivity(addFn, 'task_done', `${who} marked "${t.title}" as ${t.status}.`, { projectId: next.id, relatedId: t.id, link: `/projects/${next.id}` });
      } else {
        pushActivity(addFn, 'general', `${who} changed task "${t.title}" to ${t.status}.`, { projectId: next.id, relatedId: t.id, link: `/projects/${next.id}` });
      }
    }
  });

  // Milestones
  next.milestones.forEach((m) => {
    const old = prev.milestones.find((x) => x.id === m.id);
    if (old && old.status !== m.status) {
      const verb = m.status === 'Completed' ? 'completed' : m.status === 'Delayed' ? 'marked as delayed' : `changed to ${m.status}`;
      pushActivity(addFn, 'general', `${who} ${verb} milestone "${m.name}".`, { projectId: next.id, relatedId: m.id, link: `/projects/${next.id}` });
    }
  });

  // Launch items
  next.prItems.forEach((pr) => {
    const old = prev.prItems.find((x) => x.id === pr.id);
    if (!old) {
      pushActivity(addFn, 'general', `${who} created launch item "${pr.title}".`, { projectId: next.id, relatedId: pr.id, link: '/launches' });
    } else {
      if (old.approvalStatus !== pr.approvalStatus && pr.approvalStatus === 'Approved') {
        pushActivity(addFn, 'launch_approved', `${who} marked "${pr.title}" as Approved.`, { projectId: next.id, relatedId: pr.id, link: '/launches' });
      }
      if (old.publishingStatus !== pr.publishingStatus) {
        if (pr.publishingStatus === 'Scheduled') {
          pushActivity(addFn, 'general', `${who} scheduled "${pr.title}".`, { projectId: next.id, relatedId: pr.id, link: '/launches' });
        } else if (pr.publishingStatus === 'Posted') {
          pushActivity(addFn, 'launch_posted', `${who} marked "${pr.title}" as Posted.`, { projectId: next.id, relatedId: pr.id, link: '/launches' });
        }
      }
    }
  });
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadAppData);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Expose members for activity actor resolution
  useEffect(() => {
    (window as unknown as { __rccs_members?: Member[] }).__rccs_members = data.members;
  }, [data.members]);

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

  const addActivityInternal = useCallback((a: ActivityItem) => {
    const items = dataRef.current.activityItems ?? [];
    const trimmed = items.length >= 200 ? items.slice(-199) : items;
    patch({ activityItems: [...trimmed, a] });
  }, [patch]);

  const audit = useCallback((
    action: Parameters<typeof logAudit>[0]['action'],
    entityType: Parameters<typeof logAudit>[0]['entityType'],
    summary: string,
    extra?: { entityId?: string; projectId?: string },
  ) => {
    logAudit({
      actorProfileId: getActor().id,
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
      setActorName: (name) => {
        (window as unknown as { __rccs_actor_name?: string | null }).__rccs_actor_name = name;
      },

      saveProject: (p) => {
        const prev = dataRef.current.projects.find((x) => x.id === p.id);
        const isNew = !prev;
        logProjectNestedChanges(addActivityInternal, prev, p);
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
        const prev = dataRef.current.meetings.find((x) => x.id === m.id);
        const isNew = !prev;
        const actor = getActor();
        if (isNew) {
          pushActivity(addActivityInternal, 'general', `${actor.name} scheduled meeting "${m.title}".`, { projectId: m.projectId, relatedId: m.id, link: '/meetings' });
        }
        if (prev) {
          m.actionItems.forEach((a) => {
            if (!prev.actionItems.some((x) => x.id === a.id)) {
              pushActivity(addActivityInternal, 'meeting_action_created', `${actor.name} added action item "${a.title}" in ${m.title}.`, { projectId: m.projectId, relatedId: a.id, link: '/meetings' });
            }
          });
        }
        patch({ meetings: upsert(dataRef.current.meetings, m) });
        audit(isNew ? 'created' : 'updated', 'meeting', `${isNew ? 'Scheduled' : 'Updated'} meeting: ${m.title}`, { entityId: m.id, projectId: m.projectId });
      },
      deleteMeeting: (id) => {
        const m = dataRef.current.meetings.find((x) => x.id === id);
        patch({ meetings: remove(dataRef.current.meetings, id) });
        audit('deleted', 'meeting', `Deleted meeting: ${m?.title ?? id}`, { entityId: id });
      },

      saveSponsor: (s) => {
        const prev = dataRef.current.sponsors.find((x) => x.id === s.id);
        const isNew = !prev;
        const actor = getActor();
        const proj = dataRef.current.projects.find((p) => p.id === s.projectId);
        if (isNew) {
          pushActivity(addActivityInternal, 'sponsor_changed', `${actor.name} added sponsor "${s.name}".`, { projectId: s.projectId, relatedId: s.id, link: '/money' });
        } else {
          if (prev.stage !== s.stage) {
            pushActivity(addActivityInternal, 'sponsor_changed', `${actor.name} moved "${s.name}" to ${s.stage}.`, { projectId: s.projectId, relatedId: s.id, link: '/money' });
          }
          if (prev.paymentStatus !== s.paymentStatus) {
            pushActivity(addActivityInternal, 'payment_changed', `${actor.name} updated "${s.name}" payment to ${s.paymentStatus}.`, { projectId: s.projectId, relatedId: s.id, link: '/money' });
          }
        }
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
        const actor = getActor();
        const proj = dataRef.current.projects.find((p) => p.id === t.projectId);
        if (isNew) {
          pushActivity(addActivityInternal, 'transaction_added', `${actor.name} added ${formatCurrency(t.amount)} ${t.type.toLowerCase()} to ${proj?.name ?? 'project'}.`, { projectId: t.projectId, relatedId: t.id, link: '/money' });
        }
        patch({ transactions: upsert(dataRef.current.transactions, t) });
        audit(isNew ? 'created' : 'updated', 'transaction', `${isNew ? 'Recorded' : 'Updated'} transaction: ${t.category} (${t.type})`, { entityId: t.id, projectId: t.projectId });
      },
      deleteTransaction: (id) => {
        const t = dataRef.current.transactions.find((x) => x.id === id);
        patch({ transactions: remove(dataRef.current.transactions, id) });
        audit('deleted', 'transaction', `Deleted transaction: ${t?.category ?? id}`, { entityId: id });
      },

      saveApproval: (a) => {
        const prev = dataRef.current.approvals.find((x) => x.id === a.id);
        const isNew = !prev;
        const actor = getActor();
        if (isNew) {
          pushActivity(addActivityInternal, 'general', `${actor.name} submitted approval request "${a.title}".`, { projectId: a.projectId ?? undefined, relatedId: a.id, link: '/approvals' });
        } else if (prev.status !== a.status) {
          const verb = a.status === 'Approved' ? 'approved' : a.status === 'Rejected' ? 'rejected' : 'requested changes on';
          pushActivity(addActivityInternal, 'approval_decision', `${actor.name} ${verb} "${a.title}".`, { projectId: a.projectId ?? undefined, relatedId: a.id, link: '/approvals' });
        }
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
        const actor = getActor();
        if (isNew) {
          pushActivity(addActivityInternal, 'general', `${actor.name} added file link "${f.title}".`, { projectId: f.projectId, relatedId: f.id, link: '/library?section=files' });
        }
        patch({ fileLinks: upsert(dataRef.current.fileLinks, f) });
        audit(isNew ? 'created' : 'updated', 'file_link', `${isNew ? 'Added' : 'Updated'} file link: ${f.title}`, { entityId: f.id, projectId: f.projectId });
      },
      deleteFileLink: (id) => {
        patch({ fileLinks: remove(dataRef.current.fileLinks, id) });
        audit('deleted', 'file_link', `Removed file link`, { entityId: id });
      },

      saveReport: (r) => {
        const isNew = !dataRef.current.reports.some((x) => x.id === r.id);
        const actor = getActor();
        if (isNew) {
          const typeLabel = r.type === 'Handover' ? 'handover report' : 'report';
          pushActivity(addActivityInternal, 'report_generated', `${actor.name} generated ${typeLabel} "${r.title}".`, { projectId: r.projectId, relatedId: r.id, link: '/library?section=reports' });
        }
        patch({ reports: upsert(dataRef.current.reports, r) });
        audit(isNew ? 'generated' : 'updated', 'report', `${isNew ? 'Generated' : 'Updated'} report: ${r.title}`, { entityId: r.id, projectId: r.projectId });
      },
      deleteReport: (id) => {
        patch({ reports: remove(dataRef.current.reports, id) });
        audit('deleted', 'report', `Deleted report`, { entityId: id });
      },

      saveDeliverable: (d) => {
        const prev = dataRef.current.deliverables?.find((x) => x.id === d.id);
        const isNew = !prev;
        const actor = getActor();
        if (isNew) {
          pushActivity(addActivityInternal, 'general', `${actor.name} created deliverable "${d.title}".`, { projectId: d.projectId, relatedId: d.id, link: `/projects/${d.projectId}` });
        } else if (prev && prev.status !== d.status) {
          pushActivity(addActivityInternal, 'deliverable_completed', `${actor.name} changed "${d.title}" to ${d.status}.`, { projectId: d.projectId, relatedId: d.id, link: `/projects/${d.projectId}` });
        }
        patch({ deliverables: upsert(dataRef.current.deliverables ?? [], d) });
        audit(isNew ? 'created' : 'updated', 'data', `${isNew ? 'Created' : 'Updated'} deliverable: ${d.title}`, { entityId: d.id, projectId: d.projectId });
      },
      deleteDeliverable: (id) => {
        patch({ deliverables: remove(dataRef.current.deliverables ?? [], id) });
        audit('deleted', 'data', `Deleted deliverable`, { entityId: id });
      },

      saveEventDayItem: (e) => {
        const prev = dataRef.current.eventDayItems?.find((x) => x.id === e.id);
        const isNew = !prev;
        const actor = getActor();
        if (!isNew && prev && prev.status !== e.status) {
          const type = e.status === 'Problem' ? 'event_day_problem' as const : e.status === 'Completed' ? 'event_day_completed' as const : 'general' as const;
          pushActivity(addActivityInternal, type, `${actor.name} marked "${e.title}" as ${e.status}.`, { projectId: e.projectId, relatedId: e.id, link: '/event-day' });
        }
        patch({ eventDayItems: upsert(dataRef.current.eventDayItems ?? [], e) });
        if (!isNew) audit('updated', 'data', `Event-day item updated: ${e.title}`, { entityId: e.id, projectId: e.projectId });
      },
      deleteEventDayItem: (id) => {
        patch({ eventDayItems: remove(dataRef.current.eventDayItems ?? [], id) });
      },

      addActivity: (a) => {
        addActivityInternal(a);
        logActivityItem(a);
      },
    }),
    [data, patch, persist, audit, addActivityInternal]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
