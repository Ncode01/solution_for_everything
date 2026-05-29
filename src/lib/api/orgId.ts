/** Env org id from build-time public env */
export const ENV_ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

/** Session-scoped org id discovered via GET /api/orgs/first */
let sessionDiscoveredOrgId = "";

export function getEffectiveOrgId(): string {
  return ENV_ORG_ID || sessionDiscoveredOrgId;
}

export function setSessionDiscoveredOrgId(id: string): void {
  sessionDiscoveredOrgId = id;
}
