# FlowCanvas — Live Project Status

> Last updated: Wednesday, May 28, 2026

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

## Phase history

- Phase 7–9: Gantt, dashboard, presence, invites, auth hardening
- Phase 10C: Vercel + Neon + Firebase + Railway project
- Phase 10E: Railway app live, production diagnostic green
