# Environment variables

All configuration for FlowCanvas. Copy from `.env.local.example` and `.env.server.example` in the repo root.

**Rule:** Only `NEXT_PUBLIC_*` variables are embedded in the browser bundle. Everything else stays on the server (Vercel server routes or Railway).

See also: [DEPLOY.md](./DEPLOY.md), [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Must match across platforms

These values must be **identical** or **aligned** or auth, CORS, and cookies break.

| Variable | Platforms | Rule |
|----------|-----------|------|
| `NEXT_PUBLIC_APP_URL` | Vercel | Exact browser origin (no trailing slash) |
| `BETTER_AUTH_URL` | Vercel + Railway | **Same as** `NEXT_PUBLIC_APP_URL` |
| `APP_URL` | Railway | **Same as** `NEXT_PUBLIC_APP_URL` |
| `CORS_ORIGIN` | Railway | **Same as** `NEXT_PUBLIC_APP_URL` (if set; else `APP_URL` is used) |
| `BETTER_AUTH_SECRET` | Vercel + Railway | **Identical** string |
| `DATABASE_URL` | Vercel + Railway | **Same** Neon database |
| `NEXT_PUBLIC_ORG_ID` | Vercel | Org UUID from seed for this environment |

**Preview deployments:** Each Vercel preview URL needs its own `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`, and Railway `APP_URL` if you test auth on that preview.

---

## Vercel (Next.js frontend)

File: `.env.local` locally; Vercel project **Environment Variables** in production.

### Required

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://solutionforeverything.vercel.app` | Public app origin; Better Auth base |
| `NEXT_PUBLIC_API_URL` | `https://flowcanvas-api-production.up.railway.app` | Fastify API base URL |
| `NEXT_PUBLIC_ORG_ID` | `f7e104a8-629e-4c58-9535-27f63237fd18` | Org scope for graph/canvas |
| `DATABASE_URL` | `postgresql://...neon.tech/...` | Better Auth + Next `/api/auth` |
| `BETTER_AUTH_SECRET` | 32+ char random | Session signing (match Railway) |
| `BETTER_AUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` | Auth issuer URL |

### Optional (Firebase)

If **any** key is missing, presence and live events are disabled (app still works).

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (from Firebase console) | Web SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `flowcanvas-live.firebaseapp.com` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `flowcanvas-live` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `flowcanvas-live.firebasestorage.app` | Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (numeric) | FCM |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:...:web:...` | App ID |

---

## Railway / Render (Fastify API)

File: `.env.server` locally; Railway service variables in production.

### Required

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | Drizzle / Postgres |
| `PORT` | `3001` | Listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `production` | Runtime mode |
| `APP_URL` | `https://your-app.vercel.app` | CORS allowed origin |
| `BETTER_AUTH_SECRET` | (same as Vercel) | Used when validating session via Better Auth |
| `BETTER_AUTH_URL` | (same as Vercel) | `GET /api/auth/get-session` target |

### Optional

| Variable | Example | Purpose |
|----------|---------|---------|
| `CORS_ORIGIN` | Same as `APP_URL` | Documented alias; server uses `APP_URL` in CORS callback |
| `JWT_SECRET` | (legacy) | Prefer `BETTER_AUTH_SECRET` |

---

## Local-only / scripts

| Variable | When | Purpose |
|----------|------|---------|
| `ALLOW_PROD_SEED` | `pnpm db:seed` against prod | Guard; must be `true` to seed production |
| `PROD_API_URL` | `pnpm diagnose:prod` | Remote API for smoke checks |

---

## What happens when vars are wrong

| Symptom | Likely misconfiguration |
|---------|-------------------------|
| 401 on mutations | `BETTER_AUTH_URL` ≠ browser URL |
| CORS error in console | `APP_URL` ≠ Vercel origin |
| Empty canvas / no graph | `NEXT_PUBLIC_ORG_ID` missing or wrong |
| `[Audit] NEXT_PUBLIC_ORG_ID unset` | Org env not set on Vercel |
| `[Firebase] env vars missing` | Optional Firebase not configured |
| API calls to localhost in prod | `NEXT_PUBLIC_API_URL` unset |

Console prefixes: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#debugging-checklist).

---

## Example: local development

**.env.local**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ORG_ID=<from pnpm db:seed output>
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=dev_only_change_me_long_random_string
BETTER_AUTH_URL=http://localhost:3000
```

**.env.server**

```env
DATABASE_URL=postgresql://...
PORT=3001
HOST=0.0.0.0
APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=dev_only_change_me_long_random_string
BETTER_AUTH_URL=http://localhost:3000
```

---

## Security notes

- Never commit `.env.local` or `.env.server`
- Never put secrets in `NEXT_PUBLIC_*`
- Never import `server/` code into `src/`
- Session cookies are not logged by production diagnostics
