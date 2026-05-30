/**
 * Gets the effective org ID.
 *
 * Priority order:
 *   1. Session-discovered org (via /api/orgs/first or OrgIdBootstrap) — set by auto-heal
 *   2. Runtime override from window.__ORG_ID (optional server-injected script)
 *   3. Build-time env var NEXT_PUBLIC_ORG_ID
 *
 * A stale build-time UUID is overridden once discovery runs.
 */

export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

let _sessionOrgId = "";
let _bootstrapComplete = false;
const _bootstrapListeners = new Set<() => void>();

export function getSessionOrgId(): string {
  return _sessionOrgId;
}

export function markOrgBootstrapComplete(): void {
  if (_bootstrapComplete) return;
  _bootstrapComplete = true;
  for (const listener of _bootstrapListeners) {
    listener();
  }
}

export function isOrgBootstrapComplete(): boolean {
  return _bootstrapComplete;
}

export function subscribeOrgBootstrap(onStoreChange: () => void): () => void {
  _bootstrapListeners.add(onStoreChange);
  return () => {
    _bootstrapListeners.delete(onStoreChange);
  };
}

export function setSessionOrgId(id: string): void {
  if (_sessionOrgId === id) return;
  _sessionOrgId = id;
  for (const listener of _bootstrapListeners) {
    listener();
  }
}

function getRuntimeOrgId(): string {
  if (typeof window === "undefined") return "";
  return (window as Window & { __ORG_ID?: string }).__ORG_ID ?? "";
}

/**
 * Discovered > runtime-injected > build-time env.
 * Until bootstrap completes, ignore baked ORG_ID so we do not hit the API with a stale UUID.
 */
export function getEffectiveOrgId(): string {
  if (_sessionOrgId) return _sessionOrgId;
  const runtime = getRuntimeOrgId();
  if (runtime) return runtime;
  if (!_bootstrapComplete && ORG_ID) return "";
  return ORG_ID;
}

/** @deprecated Use setSessionOrgId */
export function setSessionDiscoveredOrgId(id: string): void {
  setSessionOrgId(id);
}

/** @deprecated Use ORG_ID */
export const ENV_ORG_ID = ORG_ID;
