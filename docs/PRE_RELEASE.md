# FlowCanvas — Pre-Release Checklist

**Branch:** `fix/phase-11b-stability`  
**Purpose:** Confirm the app is safe for a single-org production pilot.

**Full documentation:** [README.md](./README.md) · [USER_MANUAL.md](./USER_MANUAL.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [API.md](./API.md) · [ENV.md](./ENV.md)

## What was checked

- Deployment docs and env examples (Vercel, Railway, Firebase, preview)
- Client bootstrap and failure diagnostics (one-time, prefixed)
- Error handling on canvas, dashboard, gantt, login, invite, panels
- Non-critical paths: viewport, Firebase presence/events, notifications
- `pnpm diagnose` / `pnpm diagnose:prod` coverage
- Client vs server secret boundaries
- No hard reload on API 401

## What was fixed in this pass

| Area | Change |
|------|--------|
| Observability | `ProductionBootstrap` — `[Audit]` logs on first client load |
| Observability | First graph load / first graph failure logs in `useOrgGraph` |
| Observability | First viewport restore outcome logged |
| Observability | `[ApiClient] 401` once per session |
| Docs | `DEPLOY.md` — service outage matrix, fixed diagnostics table |
| Docs | `TROUBLESHOOTING.md` — offline, auth vs network, Firestore codes |
| Docs | `.env.local.example` / `.env.server.example` — grouped by platform |
| Diagnose | Bootstrap, no hard redirect, no client secrets, PRE_RELEASE doc |

## Intentionally non-critical (app must still work)

| Feature | Behavior if unavailable |
|---------|-------------------------|
| Firebase presence | Disabled; no error boundary |
| Firebase events | Disabled; graph still loads via API |
| Viewport save/load | Fails silently; canvas usable |
| Notifications | UI disabled, labeled |
| Yjs CRDT | Not implemented (GAP-006) |

## Known risks (acceptable for pilot)

| Risk | Mitigation |
|------|------------|
| Preview URL CORS/auth mismatch | Documented; use prod URL or per-preview env |
| Workload load heuristic | Documented in `userLoadLevel.ts` |
| Single `APP_URL` on Railway CORS | Documented |
| Render/Railway cold start | Health check + user retry |

## Recommended Phase 12+

- Notifications backend
- Preview multi-origin CORS (`CORS_ORIGIN` list)
- Configurable workload thresholds
- Optional `/debug` read-only status page (if ops need it)

---

## How to verify production readiness

### Automated

```bash
pnpm typecheck
pnpm typecheck:server
pnpm diagnose          # local; start pnpm dev:server for API checks
PROD_API_URL=https://your-api.up.railway.app \
NEXT_PUBLIC_ORG_ID=<uuid> \
pnpm diagnose:prod
```

### Manual (≈15 min)

1. Sign in at production `/login` — no redirect loop.
2. Console: one `[Audit] FlowCanvas client started` and `[Audit] Org graph loaded`.
3. Canvas idle 2+ minutes — no reload loop or flicker.
4. Drag task — position holds after refresh.
5. Dashboard + Gantt — open with data; break API URL and confirm error + **Try again**.
6. Sign out — returns to login; sign in again.
7. Optional: unset Firebase env on preview — app loads; one `[Firebase]` / `[Presence]` warning.
8. Notifications bell — disabled, no fake unread indicator.

### Console prefixes (filter in DevTools)

| Prefix | When |
|--------|------|
| `[Audit]` | Bootstrap, graph loaded |
| `[AuthClient]` | Resolved auth base URL |
| `[ApiClient]` | Missing API URL default, 401 |
| `[OrgGraph]` | Graph errors, drag, rebuild skip |
| `[ViewportPersistence]` | Viewport load/save issues |
| `[Firebase]` / `[CanvasEvents]` / `[Presence]` | Optional realtime |
| `[DeadEnd]` | Blocked user action (toast shown) |
| `[UI]` | Error boundary |

---

## Diagnostics added (this pass)

| Key | Message | File |
|-----|---------|------|
| `audit-app-boot` | Client started | `ProductionBootstrap.tsx` |
| `audit-no-org-id` | Missing org env | `ProductionBootstrap.tsx` |
| `audit-api-url-default` | API URL default | `ProductionBootstrap.tsx` |
| `audit-app-url-default` | App URL default | `ProductionBootstrap.tsx` |
| `org-graph-loaded` | Graph success summary | `useOrgGraph.ts` |
| `org-graph-query-failed` | Non-401 graph failure | `useOrgGraph.ts` |
| `api-unauthorized` | 401 on any API call | `client.ts` |
| `viewport-restored` / `viewport-fit-default` | Viewport init | `useViewportPersistence.ts` |

All use `logOnce` — at most one line per key per browser session.
