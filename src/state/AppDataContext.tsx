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
} from '../types';
import { loadAppData, saveAppData } from '../lib/storage';

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

interface AppDataContextValue {
  data: AppData;
  replaceAll: (next: AppData) => void;

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

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      replaceAll: (next) => persist(next),

      saveProject: (p) => patch({ projects: upsert(dataRef.current.projects, p) }),
      deleteProject: (id) => patch({ projects: remove(dataRef.current.projects, id) }),

      saveMember: (m) => patch({ members: upsert(dataRef.current.members, m) }),
      deleteMember: (id) => patch({ members: remove(dataRef.current.members, id) }),

      saveMeeting: (m) => patch({ meetings: upsert(dataRef.current.meetings, m) }),
      deleteMeeting: (id) => patch({ meetings: remove(dataRef.current.meetings, id) }),

      saveSponsor: (s) => patch({ sponsors: upsert(dataRef.current.sponsors, s) }),
      deleteSponsor: (id) => patch({ sponsors: remove(dataRef.current.sponsors, id) }),

      saveBudget: (b) => patch({ budgets: upsert(dataRef.current.budgets, b) }),
      deleteBudget: (id) => patch({ budgets: remove(dataRef.current.budgets, id) }),

      saveTransaction: (t) => patch({ transactions: upsert(dataRef.current.transactions, t) }),
      deleteTransaction: (id) => patch({ transactions: remove(dataRef.current.transactions, id) }),

      saveApproval: (a) => patch({ approvals: upsert(dataRef.current.approvals, a) }),
      deleteApproval: (id) => patch({ approvals: remove(dataRef.current.approvals, id) }),

      saveFileLink: (f) => patch({ fileLinks: upsert(dataRef.current.fileLinks, f) }),
      deleteFileLink: (id) => patch({ fileLinks: remove(dataRef.current.fileLinks, id) }),

      saveReport: (r) => patch({ reports: upsert(dataRef.current.reports, r) }),
      deleteReport: (id) => patch({ reports: remove(dataRef.current.reports, id) }),
    }),
    [data, patch, persist]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
