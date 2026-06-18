import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ActivityItem,
  AppData,
  ApprovalRequest,
  Budget,
  Deliverable,
  EventDayItem,
  FileLink,
  Meeting,
  Member,
  Project,
  Report,
  Sponsor,
  Transaction,
} from '../types';
import { auth, firebaseConfigured } from '../lib/firebaseClient';
import {
  deleteFirebaseCollectionItem,
  loadFirebaseAppData,
  replaceFirebaseAppData,
  saveFirebaseCollectionItem,
} from '../lib/firebaseDataProvider';
import { createActivityItem, logActivityItem } from '../lib/activityLog';
import { formatCurrency } from '../lib/dateUtils';
import { logAudit } from '../lib/audit';
import { loadAppData, saveAppData } from '../lib/storage';

interface Identifiable {
  id: string;
}

function normalizeTransaction(transaction: Transaction): Transaction {
  const quantity = Math.max(1, Number(transaction.quantity) || 1);
  const selectedQuote = transaction.quotations?.find((quote) => quote.selected && quote.amount > 0);
  const fallbackAmount = Number(transaction.amount) || 0;
  const calculatedAmount = selectedQuote?.amount && selectedQuote.amount > 0
    ? selectedQuote.amount
    : Number(transaction.unitCost || 0) > 0
      ? Number(transaction.unitCost) * quantity
      : fallbackAmount;

  return {
    ...transaction,
    itemName: transaction.itemName?.trim() || transaction.notes?.trim() || transaction.category,
    quantity,
    unitCost: Number(transaction.unitCost) > 0
      ? Number(transaction.unitCost)
      : quantity > 0
        ? calculatedAmount / quantity
        : calculatedAmount,
    amount: calculatedAmount,
    quotations: transaction.quotations?.map((quote, index) => ({
      ...quote,
      sellerName: quote.sellerName ?? '',
      amount: Number(quote.amount) || 0,
      selected: !!quote.selected || (!transaction.quotations?.some((entry) => entry.selected) && index === 0),
    })),
  };
}

function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    transactions: (data.transactions ?? []).map(normalizeTransaction),
  };
}

function upsert<T extends Identifiable>(arr: T[], item: T): T[] {
  return arr.some((x) => x.id === item.id) ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item];
}

function remove<T extends Identifiable>(arr: T[], id: string): T[] {
  return arr.filter((x) => x.id !== id);
}

function getActor(): { id: string | null; name: string } {
  try {
    const win = window as unknown as { __rccs_actor_id?: string; __rccs_actor_name?: string };
    return { id: win.__rccs_actor_id ?? null, name: win.__rccs_actor_name ?? 'Someone' };
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
  } catch (error) {
    console.warn('[activity]', error);
  }
}

function logProjectNestedChanges(addFn: (a: ActivityItem) => void, prev: Project | undefined, next: Project) {
  const who = getActor().name;
  if (!prev) {
    pushActivity(addFn, 'project_created', `${who} created project "${next.name}".`, { projectId: next.id, link: `/projects/${next.id}` });
    return;
  }

  if (prev.name !== next.name || prev.status !== next.status) {
    pushActivity(addFn, 'project_updated', `${who} updated project "${next.name}".`, { projectId: next.id, link: `/projects/${next.id}` });
  }

  next.tasks.forEach((task) => {
    const old = prev.tasks.find((entry) => entry.id === task.id);
    if (!old) {
      pushActivity(addFn, 'task_created', `${who} created task "${task.title}" in ${next.name}.`, { projectId: next.id, relatedId: task.id, link: `/projects/${next.id}` });
    } else if (old.status !== task.status) {
      pushActivity(addFn, task.status === 'Done' || task.status === 'Approved' ? 'task_done' : 'general', `${who} changed task "${task.title}" to ${task.status}.`, { projectId: next.id, relatedId: task.id, link: `/projects/${next.id}` });
    }
  });

  next.prItems.forEach((launch) => {
    const old = prev.prItems.find((entry) => entry.id === launch.id);
    if (!old) {
      pushActivity(addFn, 'general', `${who} created launch item "${launch.title}".`, { projectId: next.id, relatedId: launch.id, link: '/launches' });
    } else if (old.publishingStatus !== launch.publishingStatus && launch.publishingStatus === 'Posted') {
      pushActivity(addFn, 'launch_posted', `${who} marked "${launch.title}" as Posted.`, { projectId: next.id, relatedId: launch.id, link: '/launches' });
    }
  });
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => normalizeAppData(loadAppData()));
  const [ready, setReady] = useState(!firebaseConfigured);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setData(loadAppData());
        setReady(true);
        return;
      }
      try {
        setData(normalizeAppData(await loadFirebaseAppData()));
      } catch (error) {
        console.warn('[firebase load]', error);
        setData(normalizeAppData(loadAppData()));
      } finally {
        setReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (window as unknown as { __rccs_members?: Member[] }).__rccs_members = data.members;
  }, [data.members]);

  const persist = useCallback((next: AppData) => {
    const normalized = normalizeAppData(next);
    setData(normalized);
    saveAppData(normalized);
  }, []);

  const patch = useCallback((partial: Partial<AppData>) => {
    persist({ ...dataRef.current, ...partial });
  }, [persist]);

  const saveRemoteItem = useCallback(async <K extends keyof AppData>(key: K, item: AppData[K][number]) => {
    if (!firebaseConfigured || !auth?.currentUser) return;
    await saveFirebaseCollectionItem(key, item);
  }, []);

  const deleteRemoteItem = useCallback(async <K extends keyof AppData>(key: K, id: string) => {
    if (!firebaseConfigured || !auth?.currentUser) return;
    await deleteFirebaseCollectionItem(key, id);
  }, []);

  const addActivityInternal = useCallback((a: ActivityItem) => {
    const items = dataRef.current.activityItems ?? [];
    const trimmed = items.length >= 200 ? items.slice(-199) : items;
    const next = [...trimmed, a];
    patch({ activityItems: next });
    saveRemoteItem('activityItems', a).catch((error) => console.warn('[firebase activity save]', error));
  }, [patch, saveRemoteItem]);

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
    }).catch((error) => console.warn('[audit]', error));
  }, []);

  const value = useMemo<AppDataContextValue>(() => ({
    data,
    replaceAll: (next) => {
      persist(next);
      if (firebaseConfigured && auth?.currentUser) {
        replaceFirebaseAppData(next).catch((error) => console.warn('[firebase replace]', error));
      }
    },
    setActorId: (id) => {
      (window as unknown as { __rccs_actor_id?: string | null }).__rccs_actor_id = id;
    },
    setActorName: (name) => {
      (window as unknown as { __rccs_actor_name?: string | null }).__rccs_actor_name = name;
    },
    saveProject: (project) => {
      const prev = dataRef.current.projects.find((entry) => entry.id === project.id);
      logProjectNestedChanges(addActivityInternal, prev, project);
      patch({ projects: upsert(dataRef.current.projects, project) });
      saveRemoteItem('projects', project).catch((error) => console.warn('[firebase project save]', error));
      audit(prev ? 'updated' : 'created', 'project', `${prev ? 'Updated' : 'Created'} project: ${project.name}`, { entityId: project.id });
    },
    deleteProject: (id) => {
      patch({ projects: remove(dataRef.current.projects, id) });
      deleteRemoteItem('projects', id).catch((error) => console.warn('[firebase project delete]', error));
      audit('deleted', 'project', `Deleted project: ${id}`, { entityId: id });
    },
    saveMember: (member) => {
      patch({ members: upsert(dataRef.current.members, member) });
      saveRemoteItem('members', member).catch((error) => console.warn('[firebase member save]', error));
      audit(dataRef.current.members.some((entry) => entry.id === member.id) ? 'updated' : 'created', 'member', `Saved member: ${member.displayName}`, { entityId: member.id });
    },
    deleteMember: (id) => {
      patch({ members: remove(dataRef.current.members, id) });
      deleteRemoteItem('members', id).catch((error) => console.warn('[firebase member delete]', error));
      audit('deleted', 'member', `Removed member: ${id}`, { entityId: id });
    },
    saveMeeting: (meeting) => {
      patch({ meetings: upsert(dataRef.current.meetings, meeting) });
      saveRemoteItem('meetings', meeting).catch((error) => console.warn('[firebase meeting save]', error));
      audit(dataRef.current.meetings.some((entry) => entry.id === meeting.id) ? 'updated' : 'created', 'meeting', `Saved meeting: ${meeting.title}`, { entityId: meeting.id, projectId: meeting.projectId });
    },
    deleteMeeting: (id) => {
      patch({ meetings: remove(dataRef.current.meetings, id) });
      deleteRemoteItem('meetings', id).catch((error) => console.warn('[firebase meeting delete]', error));
      audit('deleted', 'meeting', `Deleted meeting: ${id}`, { entityId: id });
    },
    saveSponsor: (sponsor) => {
      patch({ sponsors: upsert(dataRef.current.sponsors, sponsor) });
      saveRemoteItem('sponsors', sponsor).catch((error) => console.warn('[firebase sponsor save]', error));
      audit(dataRef.current.sponsors.some((entry) => entry.id === sponsor.id) ? 'updated' : 'created', 'sponsor', `Saved sponsor: ${sponsor.name}`, { entityId: sponsor.id, projectId: sponsor.projectId });
    },
    deleteSponsor: (id) => {
      patch({ sponsors: remove(dataRef.current.sponsors, id) });
      deleteRemoteItem('sponsors', id).catch((error) => console.warn('[firebase sponsor delete]', error));
      audit('deleted', 'sponsor', `Deleted sponsor: ${id}`, { entityId: id });
    },
    saveBudget: (budget) => {
      patch({ budgets: upsert(dataRef.current.budgets, budget) });
      saveRemoteItem('budgets', budget).catch((error) => console.warn('[firebase budget save]', error));
      audit('updated', 'data', 'Updated budget settings', { entityId: budget.id, projectId: budget.projectId });
    },
    deleteBudget: (id) => {
      patch({ budgets: remove(dataRef.current.budgets, id) });
      deleteRemoteItem('budgets', id).catch((error) => console.warn('[firebase budget delete]', error));
    },
    saveTransaction: (transaction) => {
      const normalizedTransaction = normalizeTransaction(transaction);
      const isNew = !dataRef.current.transactions.some((entry) => entry.id === transaction.id);
      if (isNew) {
        const project = dataRef.current.projects.find((entry) => entry.id === transaction.projectId);
        pushActivity(addActivityInternal, 'transaction_added', `${getActor().name} added ${formatCurrency(normalizedTransaction.amount)} ${normalizedTransaction.type.toLowerCase()} to ${project?.name ?? 'project'}.`, { projectId: normalizedTransaction.projectId, relatedId: normalizedTransaction.id, link: '/money' });
      }
      patch({ transactions: upsert(dataRef.current.transactions, normalizedTransaction) });
      saveRemoteItem('transactions', normalizedTransaction).catch((error) => console.warn('[firebase transaction save]', error));
      audit(isNew ? 'created' : 'updated', 'transaction', `Saved transaction: ${normalizedTransaction.category} (${normalizedTransaction.type})`, { entityId: normalizedTransaction.id, projectId: normalizedTransaction.projectId });
    },
    deleteTransaction: (id) => {
      patch({ transactions: remove(dataRef.current.transactions, id) });
      deleteRemoteItem('transactions', id).catch((error) => console.warn('[firebase transaction delete]', error));
      audit('deleted', 'transaction', `Deleted transaction: ${id}`, { entityId: id });
    },
    saveApproval: (approval) => {
      patch({ approvals: upsert(dataRef.current.approvals, approval) });
      saveRemoteItem('approvals', approval).catch((error) => console.warn('[firebase approval save]', error));
      audit(dataRef.current.approvals.some((entry) => entry.id === approval.id) ? 'updated' : 'created', 'approval', `Saved approval: ${approval.title}`, { entityId: approval.id, projectId: approval.projectId ?? undefined });
    },
    deleteApproval: (id) => {
      patch({ approvals: remove(dataRef.current.approvals, id) });
      deleteRemoteItem('approvals', id).catch((error) => console.warn('[firebase approval delete]', error));
      audit('deleted', 'approval', `Deleted approval request: ${id}`, { entityId: id });
    },
    saveFileLink: (fileLink) => {
      patch({ fileLinks: upsert(dataRef.current.fileLinks, fileLink) });
      saveRemoteItem('fileLinks', fileLink).catch((error) => console.warn('[firebase file link save]', error));
      audit(dataRef.current.fileLinks.some((entry) => entry.id === fileLink.id) ? 'updated' : 'created', 'file_link', `Saved file link: ${fileLink.title}`, { entityId: fileLink.id, projectId: fileLink.projectId });
    },
    deleteFileLink: (id) => {
      patch({ fileLinks: remove(dataRef.current.fileLinks, id) });
      deleteRemoteItem('fileLinks', id).catch((error) => console.warn('[firebase file link delete]', error));
      audit('deleted', 'file_link', `Deleted file link: ${id}`, { entityId: id });
    },
    saveReport: (report) => {
      patch({ reports: upsert(dataRef.current.reports, report) });
      saveRemoteItem('reports', report).catch((error) => console.warn('[firebase report save]', error));
      audit(dataRef.current.reports.some((entry) => entry.id === report.id) ? 'updated' : 'generated', 'report', `Saved report: ${report.title}`, { entityId: report.id, projectId: report.projectId });
    },
    deleteReport: (id) => {
      patch({ reports: remove(dataRef.current.reports, id) });
      deleteRemoteItem('reports', id).catch((error) => console.warn('[firebase report delete]', error));
      audit('deleted', 'report', `Deleted report: ${id}`, { entityId: id });
    },
    saveDeliverable: (deliverable) => {
      patch({ deliverables: upsert(dataRef.current.deliverables ?? [], deliverable) });
      saveRemoteItem('deliverables', deliverable).catch((error) => console.warn('[firebase deliverable save]', error));
      audit(dataRef.current.deliverables.some((entry) => entry.id === deliverable.id) ? 'updated' : 'created', 'data', `Saved deliverable: ${deliverable.title}`, { entityId: deliverable.id, projectId: deliverable.projectId });
    },
    deleteDeliverable: (id) => {
      patch({ deliverables: remove(dataRef.current.deliverables ?? [], id) });
      deleteRemoteItem('deliverables', id).catch((error) => console.warn('[firebase deliverable delete]', error));
      audit('deleted', 'data', `Deleted deliverable: ${id}`, { entityId: id });
    },
    saveEventDayItem: (eventDayItem) => {
      patch({ eventDayItems: upsert(dataRef.current.eventDayItems ?? [], eventDayItem) });
      saveRemoteItem('eventDayItems', eventDayItem).catch((error) => console.warn('[firebase event-day save]', error));
      audit(dataRef.current.eventDayItems.some((entry) => entry.id === eventDayItem.id) ? 'updated' : 'created', 'data', `Saved event-day item: ${eventDayItem.title}`, { entityId: eventDayItem.id, projectId: eventDayItem.projectId });
    },
    deleteEventDayItem: (id) => {
      patch({ eventDayItems: remove(dataRef.current.eventDayItems ?? [], id) });
      deleteRemoteItem('eventDayItems', id).catch((error) => console.warn('[firebase event-day delete]', error));
    },
    addActivity: (activity) => {
      addActivityInternal(activity);
      logActivityItem(activity);
    },
  }), [addActivityInternal, audit, data, deleteRemoteItem, patch, persist, saveRemoteItem]);

  if (!ready) return null;

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
