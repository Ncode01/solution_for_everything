# FlowCanvas — Deployment Guide

Free-tier deployment: **Vercel** (Next.js frontend) + **Railway** or **Render** (Fastify API) + **Neon** (Postgres) + **Firebase** (Firestore events + presence).

## Prerequisites

- Node.js 20+
- pnpm 9
- Firebase CLI (`npm i -g firebase-tools`)
- Accounts: Vercel, Railway or Render, Neon, Firebase

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

Required env vars:

- `DATABASE_URL` (for Better Auth via Next.js)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `NEXT_PUBLIC_API_URL` → your API host
- `NEXT_PUBLIC_ORG_ID` → from `pnpm db:seed` output
- `NEXT_PUBLIC_APP_URL` → Vercel URL
- All `NEXT_PUBLIC_FIREBASE_*` keys

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

1. Sign in at `/login` with owner credentials.
2. Confirm TopBar no longer shows “Complete setup”.
3. Open canvas — tasks load from API.
4. Create a task — toast + persistence.
5. Open second browser — presence chips appear.

## CORS

The API only allows:

- `APP_URL` (production frontend)
- `http://localhost:*` (development)

Cookies use `credentials: 'include'` on all API calls from the browser.

## Production diagnostic (no local .env.server)

```bash
PROD_API_URL=https://your-api.up.railway.app \
NEXT_PUBLIC_ORG_ID=<production-org-uuid> \
pnpm diagnose:prod
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on mutations | Sign in again; check `BETTER_AUTH_URL` matches frontend |
| CORS error | Set `APP_URL` / `CORS_ORIGIN` to exact Vercel URL |
| “Complete setup” | Run `pnpm auth:link-owner` |
| Firebase presence missing | Deploy rules; verify `NEXT_PUBLIC_FIREBASE_*` |
