import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { AppData } from '../types';
import { db, firebaseConfigured } from './firebaseClient';

type AppCollectionKey = keyof AppData;

const COLLECTION_NAMES: Record<AppCollectionKey, string> = {
  projects: 'projects',
  members: 'members',
  meetings: 'meetings',
  sponsors: 'sponsors',
  budgets: 'budgets',
  transactions: 'transactions',
  approvals: 'approvals',
  fileLinks: 'fileLinks',
  reports: 'reports',
  deliverables: 'deliverables',
  eventDayItems: 'eventDayItems',
  activityItems: 'activityItems',
};

function assertFirebase() {
  if (!firebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

async function loadCollection<T>(name: string): Promise<T[]> {
  const database = assertFirebase();
  const snapshot = await getDocs(collection(database, name));
  return snapshot.docs.map((entry) => entry.data() as T);
}

export async function loadFirebaseAppData(): Promise<AppData> {
  const [
    projects,
    members,
    meetings,
    sponsors,
    budgets,
    transactions,
    approvals,
    fileLinks,
    reports,
    deliverables,
    eventDayItems,
    activityItems,
  ] = await Promise.all([
    loadCollection<AppData['projects'][number]>('projects'),
    loadCollection<AppData['members'][number]>('members'),
    loadCollection<AppData['meetings'][number]>('meetings'),
    loadCollection<AppData['sponsors'][number]>('sponsors'),
    loadCollection<AppData['budgets'][number]>('budgets'),
    loadCollection<AppData['transactions'][number]>('transactions'),
    loadCollection<AppData['approvals'][number]>('approvals'),
    loadCollection<AppData['fileLinks'][number]>('fileLinks'),
    loadCollection<AppData['reports'][number]>('reports'),
    loadCollection<AppData['deliverables'][number]>('deliverables'),
    loadCollection<AppData['eventDayItems'][number]>('eventDayItems'),
    loadCollection<AppData['activityItems'][number]>('activityItems'),
  ]);

  return {
    projects,
    members,
    meetings,
    sponsors,
    budgets,
    transactions,
    approvals,
    fileLinks,
    reports,
    deliverables,
    eventDayItems,
    activityItems,
  };
}

export async function saveFirebaseCollectionItem<K extends AppCollectionKey>(
  collectionKey: K,
  item: AppData[K][number],
): Promise<void> {
  const database = assertFirebase();
  const name = COLLECTION_NAMES[collectionKey];
  await setDoc(doc(database, name, item.id), item);
}

export async function deleteFirebaseCollectionItem<K extends AppCollectionKey>(
  collectionKey: K,
  id: string,
): Promise<void> {
  const database = assertFirebase();
  const name = COLLECTION_NAMES[collectionKey];
  await deleteDoc(doc(database, name, id));
}

export async function replaceFirebaseAppData(data: AppData): Promise<void> {
  const database = assertFirebase();
  const batch = writeBatch(database);

  await Promise.all(
    (Object.entries(COLLECTION_NAMES) as Array<[AppCollectionKey, string]>).map(async ([key, name]) => {
      const snapshot = await getDocs(collection(database, name));
      snapshot.docs.forEach((entry) => batch.delete(entry.ref));
      data[key].forEach((item) => {
        batch.set(doc(database, name, item.id), item);
      });
    })
  );

  await batch.commit();
}
