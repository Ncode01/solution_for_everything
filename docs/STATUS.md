# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 27, 2026

## Current Phase: Phase 10 — DEPLOY IN PROGRESS

**Status:** Firebase production project live (`flowcanvas-live`). Railway + Vercel require CLI/dashboard login to finish.

## Phase 10 Progress

- [x] Firebase project `flowcanvas-live` created
- [x] Firestore rules deployed to production
- [x] `.firebaserc` with `production` alias
- [x] `/health` returns `{ status: "ok" }` for Railway checks
- [x] `pnpm diagnose:prod` script added
- [x] `ALLOW_PROD_SEED=true` for one-time production seed
- [ ] Neon production branch seeded (run manually with prod `DATABASE_URL`)
- [ ] Railway backend deployed
- [ ] Vercel frontend deployed
- [ ] `auth:seed` + `auth:link-owner` on production
- [ ] Tag `v1.0.0`

### Finish deploy (you)

1. `npx vercel login` → import repo → set env vars from `docs/DEPLOY.md`
2. Railway dashboard → deploy from GitHub → set env vars → update `APP_URL` / `BETTER_AUTH_URL` to Vercel URL
3. `PROD_API_URL=... NEXT_PUBLIC_ORG_ID=... pnpm diagnose:prod`
4. Smoke test → `git tag -a v1.0.0`

## Phase 9 Progress (complete)

- [x] Route auth, keyboard help, error boundaries, toasts, deploy config

## Production URLs (pending)

| Service | URL |
|---------|-----|
| Frontend | _Set after Vercel deploy_ |
| Backend | _Set after Railway deploy_ |
| Firebase | flowcanvas-live.firebaseapp.com |
| Database | Neon production branch |
