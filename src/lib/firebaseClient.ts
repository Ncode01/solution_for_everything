import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

export const firebaseConfigured = Boolean(
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.storageBucket &&
  config.messagingSenderId &&
  config.appId
);

export const firebaseApp: FirebaseApp | null = firebaseConfigured ? initializeApp(config) : null;
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export type ConnectionMode = 'local' | 'firebase';

export function getConnectionMode(): ConnectionMode {
  return firebaseConfigured ? 'firebase' : 'local';
}

export function getConnectionLabel(): string {
  return firebaseConfigured ? 'Firebase Connected' : 'Local Demo Mode';
}
