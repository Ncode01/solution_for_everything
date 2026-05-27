# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 27, 2026

## Current Phase: Phase 8 — COMPLETE

**Status:** Collaborative presence, cursor broadcast, invite system, and domain user linking shipped.

## Phase 8 Progress

- [x] Firestore presence schema with throttled writes (30s heartbeat, 2s cursor, 5s viewport)
- [x] `usePresence` + `PresenceOrchestrator` at AppShell level
- [x] `RemoteCursors` on canvas (ReactFlow screen projection)
- [x] Presence chips in TopBar
- [x] Firestore rules tightened (catch-all deny)
- [x] `invite_tokens` table + `authUserId` on domain users
- [x] Invite API routes (create, validate, accept)
- [x] `GET /api/users/me` domain user lookup
- [x] `/invite/[token]` page (sign-up + accept flow)
- [x] TopBar invite form with copy link
- [x] `useCurrentUser` hook
- [x] Diagnostic v4.0 (50 checks)

### Not in this session

- [ ] Production Firestore security rules with auth.uid checks (Phase 10)
- [ ] Email delivery for invites (copy-link only)

## Phase 7 Progress (complete)

- [x] Gantt view, Dashboard view, Recharts workload chart
- [x] Diagnostic v3.0 (38 checks)

## Next

- Phase 9 — Polish + production hardening
- Phase 10 — Deploy (Vercel + Railway/Render free tier)
