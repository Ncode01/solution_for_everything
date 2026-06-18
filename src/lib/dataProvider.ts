/**
 * Data Provider Abstraction — Phase Four
 *
 * Selects between:
 *   - localProvider: reads/writes localStorage (Local Demo Mode)
 *   - firebaseProvider: reads/writes Firestore (Firebase Connected)
 *
 * The active provider is chosen based on whether Firebase env vars are set.
 * The app never crashes if Firebase is
 * not configured — it falls back to localStorage silently.
 *
 * Usage:
 *   import { getConnectionMode } from './firebaseClient';
 *   // The AppDataContext already uses localStorage. Firebase reads are
 *   // performed via the shared Firestore provider when available.
 *   // This file provides the mode indicator and helper utilities.
 */

import { getConnectionMode, type ConnectionMode } from './firebaseClient';

export { getConnectionMode, type ConnectionMode };

/**
 * Returns a human-readable label for the current connection mode.
 */
export function getConnectionLabel(): string {
  return getConnectionMode() === 'firebase' ? 'Firebase Connected' : 'Local Demo Mode';
}

/**
 * Returns whether the app is in local demo mode.
 */
export function isLocalMode(): boolean {
  return getConnectionMode() === 'local';
}

/**
 * Returns whether the app is connected to Firebase.
 */
export function isFirebaseMode(): boolean {
  return getConnectionMode() === 'firebase';
}
