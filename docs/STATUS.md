# FlowCanvas — Live Project Status

> Last updated: May 29, 2026

## Phase 10 — DEPLOYED ✅

**Tag:** `v1.0.0`  
**Commit:** see `git log -1` on `main`

| Service | URL |
|---------|-----|
| Frontend | https://solutionforeverything.vercel.app |
| Backend | https://flowcanvas-api-production.up.railway.app |
| Firebase | flowcanvas-live.firebaseapp.com |
| Database | Neon `dawn-snow-06912825` / branch `production` |

**Production `ORG_ID`:** `f7e104a8-629e-4c58-9535-27f63237fd18`

## Verification (Phase 10E)

- [x] Railway `/health` → `{ "status": "ok" }`
- [x] CORS: `Access-Control-Allow-Origin` + credentials for Vercel origin
- [x] `pnpm diagnose:prod` → **6/6 PASS**
- [x] Vercel `/login` 200, unauthenticated `/` → redirect
- [ ] Full 30-check browser smoke (canvas, gantt, presence, invite) — run manually at production URL

**Login (production):** `owner@flowcanvas.dev` / `demo12345`

## Phase 11B — Stability + production audit

Branch: `fix/phase-11b-stability`

**Production-ready (pilot):**
- Canvas graph from API (`useOrgGraph` + hash guard + merge)
- Task CRUD, drag persist, optimistic position cache
- Project expand/collapse from API cache
- Workload view from live canvas nodes (not mock seed)
- Edge restore from API graph snapshot
- Auth: no hard reload on 401; middleware + inline errors
- Firebase events/presence: optional, graceful disable

**Intentionally non-critical:**
- Yjs CRDT sync (PRD vision — see GAP-006)
- Preview deployment CORS (single `APP_URL` on Railway — use matching env per preview)
- Workload `loadLevel` heuristic (`taskCount * 12.5` in `buildGraphFromApi`)

**Pass 3 hardening (same branch):**
- Dead notifications control disabled with clear label (no fake unread dot)
- Task nodes keyboard-accessible; command palette debug hidden in production
- Canvas empty state includes **Create task** button; failed commands show toasts
- Menus: Escape to close; expanded state exposed to assistive tech

**Pass 2 hardening (same branch):**
- Sidebar: API-backed projects and people (no hardcoded demo list)
- Dashboard / Gantt: error + retry + clearer empty states
- Error boundaries remount on retry
- Canvas error overlay: retry + sign-in link
- Load heuristic documented in `userLoadLevel.ts`

**Intentionally not shipped:**
- Canvas bookmarks (sidebar section removed)
- Yjs CRDT (GAP-006)

**Still risky / watch:**
- Vercel preview URL vs `BETTER_AUTH_URL` / `APP_URL` mismatch → 401
- Workload thresholds are heuristic, not HR capacity rules

**Pre-release (pilot-ready):** See [PRE_RELEASE.md](./PRE_RELEASE.md) for go/no-go verification.

**Documentation:** [README.md](./README.md) (index) · [USER_MANUAL.md](./USER_MANUAL.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [API.md](./API.md)

Full audit: [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md)

### Production-ready for pilot

| Area | Status |
|------|--------|
| Canvas + API graph | Ready |
| Auth (no hard reload on 401) | Ready |
| Dashboard / Gantt errors + retry | Ready |
| Sidebar / workload (real data) | Ready |
| Viewport persistence | Non-critical; fails gracefully |
| Firebase presence/events | Non-critical; fails gracefully |
| Notifications | Disabled in UI |
| Yjs CRDT | Deferred (GAP-006) |
| Preview deploy auth/CORS | Documented risk — configure per preview URL |

## Phase history

- Phase 7–9: Gantt, dashboard, presence, invites, auth hardening
- Phase 10C: Vercel + Neon + Firebase + Railway project
- Phase 10E: Railway app live, production diagnostic green
