import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { logOnce } from "@/lib/diagnostics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  const configured = Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
  if (!configured) {
    logOnce(
      "firebase-env-missing",
      "[Firebase] env vars missing — realtime events and presence disabled",
    );
  }
  return configured;
}

let app: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function getFirestoreDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp(firebaseConfig);
  }
  if (!firestoreDb) {
    firestoreDb = getFirestore(app);
  }
  return firestoreDb;
}
