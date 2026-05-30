/** Env org id from build-time public env */
export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

/** Session org discovered via GET /api/orgs/first (overrides stale env ORG_ID) */
let _sessionOrgId = "";

export function getSessionOrgId(): string {
  return _sessionOrgId;
}

export function setSessionOrgId(id: string): void {
  _sessionOrgId = id;
}

/** Discovered id wins over env so a stale NEXT_PUBLIC_ORG_ID does not block healing */
export function getEffectiveOrgId(): string {
  return _sessionOrgId || ORG_ID;
}

/** @deprecated Use setSessionOrgId */
export function setSessionDiscoveredOrgId(id: string): void {
  setSessionOrgId(id);
}

/** @deprecated Use ORG_ID */
export const ENV_ORG_ID = ORG_ID;
