import { AppData, Project } from '../types';
import { SEED_PROJECTS } from '../data/seedData';
import {
  SEED_MEMBERS,
  SEED_MEETINGS,
  SEED_SPONSORS,
  SEED_BUDGETS,
  SEED_TRANSACTIONS,
  SEED_APPROVALS,
  SEED_FILE_LINKS,
  SEED_REPORTS,
} from '../data/seedPhaseTwo';

// Data version — bump when making breaking schema changes so migrations can detect old data.
export const DATA_VERSION = 3;
const DATA_VERSION_KEY = 'rccs_data_version';

// localStorage keys — one per collection so older data keeps working.
const KEYS = {
  projects: 'rccs_projects',
  members: 'rccs_members',
  meetings: 'rccs_meetings',
  sponsors: 'rccs_sponsors',
  budgets: 'rccs_budgets',
  transactions: 'rccs_transactions',
  approvals: 'rccs_approvals',
  fileLinks: 'rccs_file_links',
  reports: 'rccs_reports',
} as const;

const SEEDED_KEY = 'rccs_seeded';
const LAST_SAVED_KEY = 'rccs_last_saved';

function seedData(): AppData {
  return {
    projects: SEED_PROJECTS,
    members: SEED_MEMBERS,
    meetings: SEED_MEETINGS,
    sponsors: SEED_SPONSORS,
    budgets: SEED_BUDGETS,
    transactions: SEED_TRANSACTIONS,
    approvals: SEED_APPROVALS,
    fileLinks: SEED_FILE_LINKS,
    reports: SEED_REPORTS,
  };
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeAllCollections(data: AppData): void {
  localStorage.setItem(KEYS.projects, JSON.stringify(data.projects));
  localStorage.setItem(KEYS.members, JSON.stringify(data.members));
  localStorage.setItem(KEYS.meetings, JSON.stringify(data.meetings));
  localStorage.setItem(KEYS.sponsors, JSON.stringify(data.sponsors));
  localStorage.setItem(KEYS.budgets, JSON.stringify(data.budgets));
  localStorage.setItem(KEYS.transactions, JSON.stringify(data.transactions));
  localStorage.setItem(KEYS.approvals, JSON.stringify(data.approvals));
  localStorage.setItem(KEYS.fileLinks, JSON.stringify(data.fileLinks));
  localStorage.setItem(KEYS.reports, JSON.stringify(data.reports));
}

export function loadAppData(): AppData {
  try {
    const seeded = localStorage.getItem(SEEDED_KEY);
    if (!seeded) {
      const seed = seedData();
      writeAllCollections(seed);
      localStorage.setItem(SEEDED_KEY, 'true');
      return seed;
    }
    return {
      projects: readCollection<Project>(KEYS.projects, []),
      members: readCollection(KEYS.members, SEED_MEMBERS),
      meetings: readCollection(KEYS.meetings, SEED_MEETINGS),
      sponsors: readCollection(KEYS.sponsors, SEED_SPONSORS),
      budgets: readCollection(KEYS.budgets, SEED_BUDGETS),
      transactions: readCollection(KEYS.transactions, SEED_TRANSACTIONS),
      approvals: readCollection(KEYS.approvals, SEED_APPROVALS),
      fileLinks: readCollection(KEYS.fileLinks, SEED_FILE_LINKS),
      reports: readCollection(KEYS.reports, SEED_REPORTS),
    };
  } catch {
    return seedData();
  }
}

export function saveAppData(data: AppData): void {
  writeAllCollections(data);
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
  localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
}

export function getDataVersion(): number {
  const v = localStorage.getItem(DATA_VERSION_KEY);
  return v ? parseInt(v, 10) : 1;
}

export function getLastSaved(): string | null {
  return localStorage.getItem(LAST_SAVED_KEY);
}

export function resetToSeedData(): AppData {
  const seed = seedData();
  writeAllCollections(seed);
  localStorage.setItem(SEEDED_KEY, 'true');
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
  localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
  return seed;
}

// --- Backup / restore ---

export function exportData(): string {
  return JSON.stringify(loadAppData(), null, 2);
}

const COLLECTION_KEYS: (keyof AppData)[] = [
  'projects',
  'members',
  'meetings',
  'sponsors',
  'budgets',
  'transactions',
  'approvals',
  'fileLinks',
  'reports',
];

export function parseImportedData(raw: string): AppData {
  const parsed = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Backup file is not a valid object.');
  }
  const seed = seedData();
  const result: AppData = { ...seed };
  for (const key of COLLECTION_KEYS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`Field "${key}" must be an array.`);
    }
    // Missing collections fall back to empty arrays (not seed) so import is faithful.
    result[key] = (Array.isArray(value) ? value : []) as never;
  }
  return result;
}

export function importData(raw: string): AppData {
  const data = parseImportedData(raw);
  saveAppData(data);
  localStorage.setItem(SEEDED_KEY, 'true');
  return data;
}

// --- Phase One backward-compatible helpers (still used by some callers) ---

export function loadProjects(): Project[] {
  return loadAppData().projects;
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(KEYS.projects, JSON.stringify(projects));
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
}
