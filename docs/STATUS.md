# FlowCanvas — Live Project Status

> Last updated: Wednesday, May 28, 2026

## Current Phase: Phase 10C — DEPLOY (frontend live, API pending GitHub)

**Status:** Vercel production is live. Neon production seeded. Railway project created but **requires GitHub App install** before first deploy.

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://solutionforeverything.vercel.app |
| Backend (domain ready) | https://flowcanvas-api-production.up.railway.app |
| Firebase | flowcanvas-live.firebaseapp.com |
| Neon | `dawn-snow-06912825` / branch `production` |

**Production `ORG_ID`:** `f7e104a8-629e-4c58-9535-27f63237fd18`

## Phase 10C Progress

- [x] Neon production DB seeded (`ALLOW_PROD_SEED=true`)
- [x] Firebase `flowcanvas-live` + rules deployed
- [x] Vercel linked, env vars set, production deploy
- [x] `auth:seed` + `auth:link-owner` on production Neon
- [x] Railway project `flowcanvas-api` + service + domain + env vars (via GraphQL)
- [ ] **Railway first deploy** — connect GitHub: [Railway project](https://railway.com/project/352e91bd-3e0b-427c-bbc5-f3ad5a5f0466) → Settings → connect `Ncode01/solution_for_everything` → Deploy
- [ ] `pnpm diagnose:prod` 6/6 (blocked on API `/health`)
- [ ] Manual smoke tests (30 checks)
- [ ] Tag `v1.0.0`

### Unblock Railway (one dashboard step)

Error from Railway API: `No GitHub installation found for repo: Ncode01/solution_for_everything`

1. Open https://railway.com/project/352e91bd-3e0b-427c-bbc5-f3ad5a5f0466
2. Install Railway GitHub App for org/user `Ncode01` and grant access to `solution_for_everything`
3. Service `flowcanvas-api` → Deploy (or push to `main` — already pushed)

Build: `pnpm install --frozen-lockfile && pnpm build:server`  
Start: `node server/dist/index.js`

After `/health` returns `ok`, update Railway `APP_URL` / `BETTER_AUTH_URL` if needed (already set to Vercel URL in staged config).

## Commit

Latest deploy prep: `2d8cb6c`
