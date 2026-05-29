# FlowCanvas — Deployment Guide

Free-tier deployment: **Vercel** (Next.js frontend) + **Railway** or **Render** (Fastify API) + **Neon** (Postgres) + **Firebase** (Firestore events + presence).

For debugging production issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Prerequisites

- Node.js 20+
- pnpm 9
- Firebase CLI (`npm i -g firebase-tools`)
- Accounts: Vercel, Railway or Render, Neon, Firebase

## Required environment variables

These must be consistent across Vercel (frontend) and Railway (API) where noted.

| Variable | Vercel | Railway | Notes |
|----------|--------|---------|-------|
| `NEXT_PUBLIC_API_URL` | ✓ | — | Public API URL (e.g. `https://xxx.up.railway.app`) |
| `NEXT_PUBLIC_APP_URL` | ✓ | — | Exact frontend origin, no trailing slash |
| `NEXT_PUBLIC_ORG_ID` | ✓ | — | Org UUID from seed |
| `DATABASE_URL` | ✓ | ✓ | Same Neon database |
| `BETTER_AUTH_SECRET` | ✓ | ✓ | **Must match** on both |
| `BETTER_AUTH_URL` | ✓ | ✓ | Same as `NEXT_PUBLIC_APP_URL` in production |
| `APP_URL` | — | ✓ | Same as frontend URL (CORS) |
| `CORS_ORIGIN` | — | ✓ | Same as frontend URL |
| `NEXT_PUBLIC_FIREBASE_*` | ✓ | — | All six Firebase web config keys |

**Preview deployments:** Vercel preview URLs differ per branch. Either set preview-specific `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` / `APP_URL` / `CORS_ORIGIN`, or test auth only on production. Mismatched origins cause 401s and failed viewport persistence — see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#preview-url-vs-production-url-auth-mismatch).

Copy `.env.local.example` → `.env.local` for local development.

## 1. Neon database

1. Create a Neon project and copy `DATABASE_URL`.
2. Add to `.env.server` (API) and ensure Next.js auth can read it via `.env.local` for Better Auth.

```bash
pnpm db:push
pnpm db:seed          # dev only unless ALLOW_PROD_SEED=true
ALLOW_PROD_SEED=true DATABASE_URL="postgresql://...(prod)" pnpm db:seed
pnpm auth:seed
pnpm auth:link-owner  # links owner@flowcanvas.dev auth → domain user
```

## 2. Firebase

**Production project (Phase 10):** `flowcanvas-live` — rules deployed via `.firebaserc`.

1. Create a Firebase project (or use `flowcanvas-live`).
2. Enable Firestore (native mode) in the [Firebase console](https://console.firebase.google.com/project/flowcanvas-live/firestore).
3. Copy web app config into `.env.local` and Vercel:

```bash
firebase use production
firebase apps:sdkconfig WEB <your-app-id>
```

4. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

**Quota (free tier):** ~50K reads/day, ~20K writes/day. Presence is throttled (30s heartbeat, 2s cursor, 5s viewport).

**If Firestore is missing:** Console shows `[Firebase] env vars missing` or `[CanvasEvents] Firestore unavailable` — the app still runs; realtime and presence are disabled.

## 3. Better Auth secrets

Generate a long random `BETTER_AUTH_SECRET` (32+ chars).

| Variable | Example |
|----------|---------|
| `BETTER_AUTH_SECRET` | (random) |
| `BETTER_AUTH_URL` | `https://your-app.vercel.app` |
| `APP_URL` | same as frontend URL |
| `CORS_ORIGIN` | same as frontend URL |

## 4. Vercel (frontend)

1. Import the GitHub repo.
2. Framework preset: **Next.js**.
3. Set environment variables (see `vercel.json` names or `.env.local.example`).
4. Deploy.

## 5. Railway / Render (API)

**CLI (Phase 10C):** Workspace tokens work with Railway GraphQL (`Authorization: Bearer`) but not `railway` CLI `whoami`. Create project/service via API, then connect GitHub in the dashboard before first deploy.

1. Create a service from this repo.
2. Set start command: `node server/dist/index.js` (after `pnpm build:server`).
3. Environment (`.env.server`):

```
DATABASE_URL=...
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
APP_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-app.vercel.app
```

4. Health check: `GET /health`

**Render free tier:** spins down after inactivity; cold starts ~30s.

## 6. Post-deploy checklist

```bash
# On production DB (migrations only — never db:seed in production)
pnpm db:push

# One-time prod setup (run locally against prod DATABASE_URL)
pnpm auth:seed
pnpm auth:link-owner
```

1. Sign in at `/login` with owner credentials — no redirect loop between `/` and `/login`.
2. Confirm TopBar no longer shows “Complete setup”.
3. Open canvas — tasks load from API; idle 2+ minutes with no flicker or reload loop.
4. Drag a task — position holds without snap-back; refresh confirms coordinates.
5. Expand/collapse a project cluster.
6. Create a task — toast + persistence.
7. Optional: second browser — presence chips (if Firebase configured).

```bash
PROD_API_URL=https://your-api.up.railway.app \
NEXT_PUBLIC_ORG_ID=<production-org-uuid> \
pnpm diagnose:prod
```

## CORS

The API only allows:

- `APP_URL` (production frontend)
- `http://localhost:*` (development)

Cookies use `credentials: 'include'` on all API calls from the browser.

## Client diagnostics (browser console)

Prefixed one-line warnings help identify issues without spamming:

| Prefix | Meaning |
|--------|---------|
| `[AuthClient]` | Resolved Better Auth base URL |
| `[Firebase]` | Missing Firebase env vars |
| `[DeadEnd]` | User action blocked (e.g. create task with no project) |

**Intentionally unavailable in UI:** Notifications (bell icon is disabled). Canvas bookmarks were removed from the sidebar.
| `[CanvasEvents]` | Listener init, old event ignored, Firestore error |
| `[Presence]` | Firestore unavailable, presence disabled |
| `[ViewportPersistence]` | 401/404/network on viewport load or save |
| `[OrgGraph]` | 401, skip rebuild, optimistic drag |
| `[FlowCanvas]` | Mount guards, project wiring, cascade |

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for failure modes and debugging steps.

## Production audit

See [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) for ranked issues, fixes, and remaining risks.

**Pilot blockers resolved:** mock workload data, mock edge restore, drag invalidation churn.

## Known failure modes (quick)

| Symptom | Likely cause |
|---------|----------------|
| React error #185 | Effect/store loop — see TROUBLESHOOTING |
| Site reloads every few seconds | Hard redirect on 401 in fetch (should not happen) or auth redirect loop |
| `Firestore unavailable` | DB not created or wrong project ID |
| 401 on API calls | Session expired or URL mismatch |
| Task snaps back after drag | Optimistic cache not applied — check `[OrgGraph]` logs |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on mutations | Sign in again; check `BETTER_AUTH_URL` matches frontend |
| CORS error | Set `APP_URL` / `CORS_ORIGIN` to exact Vercel URL |
| “Complete setup” | Run `pnpm auth:link-owner` |
| Firebase presence missing | Deploy rules; verify `NEXT_PUBLIC_FIREBASE_*` |
| Full detail | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
