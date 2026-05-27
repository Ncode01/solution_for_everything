# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 27, 2026

## Current Phase: Phase 9 — COMPLETE

**Status:** Production hardening, route authorization, UI polish, and deploy configuration shipped.

## Phase 9 Progress

- [x] `requireSession` helper on all mutating API routes
- [x] `credentials: 'include'` + 401 redirect in `apiFetch`
- [x] Owner auto-link script (`pnpm auth:link-owner`)
- [x] Keyboard help overlay (`?`)
- [x] Error boundaries on canvas, gantt, dashboard, right panel
- [x] Toast system wired to mutations
- [x] Canvas + Gantt empty states
- [x] Gantt loading skeleton
- [x] CORS hardened (no wildcard)
- [x] Seed production guard
- [x] `vercel.json`, `railway.json`, `docs/DEPLOY.md`
- [x] Diagnostic v5.0 (62 checks)

### Deploy follow-up (manual)

- [ ] `firebase use --add` + `firebase deploy --only firestore:rules` (if not yet run)
- [ ] Phase 10 — live deploy to Vercel + Railway/Render

## Phase 8 Progress (complete)

- [x] Presence, cursors, invites, domain user linking

## Next

- Phase 10 — Deploy (Vercel + Railway/Render, live) — tag `v1.0.0`
