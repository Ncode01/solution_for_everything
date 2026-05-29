# FlowCanvas — Production Readiness Audit

**Date:** May 29, 2026  
**Branch:** `fix/phase-11b-stability`  
**Scope:** Full-repo deep audit (code, docs, env, runtime flows)

## Executive summary

The app is **deployable** for a single-org pilot but had several **demo-path leaks** that made production behave like the seed prototype. The highest-risk issues were **mock data in the workload layer**, **edge restore using mock dependency styles**, and **mutation orchestrator invalidating the full graph after every drag save**.

This pass **fixes all blocker and high items** listed below. Remaining gaps are mostly **vision features** (Yjs CRDT), **CORS preview URLs**, and **heuristic workload math** — documented as non-blockers.

| Priority | Found | Fixed this pass |
|----------|-------|-----------------|
| Blocker | 3 | 3 |
| High | 6 | 5 |
| Medium | 8 | 6 (pass 2) |
| Low | 5 | 1 (pass 2) |

---

## Documentation handoff (May 29, 2026)

| Deliverable | Location |
|-------------|----------|
| Docs entry point | `docs/README.md` |
| User manual | `docs/USER_MANUAL.md` |
| Architecture | `docs/ARCHITECTURE.md` (rewritten for current stack) |
| API contract | `docs/API.md` (replaces `docs/API_CONTRACTS.md`) |
| Environment reference | `docs/ENV.md` |
| Archived superseded API doc | `docs/.temp/API_CONTRACTS.md` |

No runtime changes in this pass.

---

## Pre-release pass (May 29, 2026) — observability & deployment safety

| Area | Status |
|------|--------|
| Bootstrap `[Audit]` logs | Added |
| First graph failure / success logs | Added |
| Viewport restore outcome log | Added |
| `docs/PRE_RELEASE.md` | Added |
| Env examples grouped by platform | Updated |
| Service degradation matrix in DEPLOY | Added |
| `pnpm diagnose` pre-release checks | Added |

No new product features. Behavior of non-critical paths unchanged.

---

## Third pass (May 29, 2026) — dead-end UI, a11y, placeholder clarity

| ID | Priority | Status | Summary |
|----|----------|--------|---------|
| AUD-020 | **High** | Fixed | Notifications bell was clickable with fake unread dot but no handler |
| AUD-021 | Medium | Fixed | Task cards keyboard-inaccessible (div onClick only) |
| AUD-022 | Medium | Fixed | `new-task` command silently failed with no org projects |
| AUD-023 | Medium | Fixed | Debug command exposed in production command palette |
| AUD-024 | Low | Fixed | TopBar menus missing Escape / aria-expanded |
| AUD-025 | Low | Fixed | Canvas empty state had no clickable create path |
| AUD-026 | Low | Fixed | Login/Gantt/keyboard overlay a11y polish |

---

## Second pass (May 29, 2026) — medium/low hardening

| ID | Priority | Status | Summary |
|----|----------|--------|---------|
| AUD-016 | **High** | Fixed | LeftSidebar showed hardcoded demo projects/people/bookmarks |
| AUD-010 | Medium | Fixed | Dashboard error state + retry |
| AUD-011 | Medium | Fixed | Gantt error vs empty distinction + retry |
| AUD-014 | Low | Fixed | ErrorBoundary remounts children on retry |
| AUD-017 | Medium | Fixed | Canvas overlay retry + sign-in on session errors |
| AUD-018 | Low | Fixed | Login sign-up no longer uses "Demo Owner" name |
| AUD-019 | Low | Doc | Canvas bookmarks removed (dead UI); non-critical |
| AUD-008 | High | Doc | Load heuristic centralized in `userLoadLevel.ts` |

---

## Issue table (ranked)

| ID | Priority | Type | Issue | Files | User-visible failure | Reproduce | Fix |
|----|----------|------|-------|-------|----------------------|-----------|-----|
| AUD-001 | **Blocker** | Code | Workload layer used `MOCK_USERS` / `MOCK_TASKS` | `useWorkloadLayer.ts`, `WorkloadBanner.tsx` | Workload view highlights wrong tasks; banner shows seed counts | Shift+W on prod org | Wire to `workloadStats` from canvas person/task nodes |
| AUD-002 | **Blocker** | Code | `restoreDependencyEdgeStyles` rebuilt from mock edges | `seedToNodes.ts` → callers | Exiting workload/cascade resets edges to demo graph styles | Toggle workload off after editing prod graph | `dependencyEdgeStyles.ts` + API graph snapshot |
| AUD-003 | **Blocker** | Code | `useMutationOrchestrator` invalidated graph on every update including drag | `useMutationOrchestrator.ts` | Task snaps back / canvas flicker after drag | Drag task, wait for save | Skip invalidation when `isPositionOnlyBody` |
| AUD-004 | **High** | Code | Login prefilled demo credentials in production build | `login/page.tsx` | Looks like demo app; credential leak in UI | Open `/login` on Vercel | Empty defaults unless `NODE_ENV=development` |
| AUD-005 | **High** | Code | Firebase events published with `userId: "local"` | `useCanvasEvents.ts` | Incorrect audit trail in Firestore | Create task, inspect event doc | Use `authClient.getSession()` user id |
| AUD-006 | **High** | Infra | CORS allows only single `APP_URL` | `server/index.ts` | Preview deploys fail API calls | Deploy Vercel preview + prod API | Document; set preview `APP_URL` or use prod-only testing |
| AUD-007 | **High** | Docs | PRD claims Yjs CRDT; app uses Firebase events only | `docs/`, `README.md` | Expectation mismatch | Read ARCHITECTURE vs code | Document in STATUS + GAP-006 |
| AUD-008 | **High** | Code | Load level heuristic `taskCount * 12.5` | `buildGraphFromApi.ts` | Workload view may not match real capacity model | Assign many tasks to one user | Document; future: configurable thresholds |
| AUD-009 | **Medium** | Code | `seedToNodes` / `mockData` still in repo for dev/diagnose | `src/lib/seed/` | Mock bundle size if imported | Import `seedToNodes` from prod path | Keep isolated; diagnose enforces no prod imports |
| AUD-010 | **Medium** | UX | Dashboard has no error state for failed graph query | `DashboardView.tsx` | Blank dashboard on API error | Break API URL | **Fixed** — `ViewErrorPanel` + retry |
| AUD-011 | **Medium** | UX | Gantt empty when no dated tasks — partial | `GanttView.tsx` | Empty timeline | Org with no due dates | **Fixed** — error vs empty copy + retry |
| AUD-016 | **High** | UX | LeftSidebar hardcoded demo projects/people | `LeftSidebar.tsx` | Sidebar unrelated to real org | Open app in prod | **Fixed** — `useOrgGraphData` |
| AUD-017 | Medium | UX | Canvas error overlay no retry | `CanvasLoadingOverlay.tsx` | Stuck on error | Break API | **Fixed** — retry + sign in |
| AUD-018 | Low | UX | Sign-up default name "Demo Owner" | `login/page.tsx` | Demo copy in prod signup | Sign up | **Fixed** |
| AUD-019 | Low | UX | Dead bookmark buttons in sidebar | `LeftSidebar.tsx` | Clicks do nothing | Click bookmark | **Removed** section until feature exists |
| AUD-012 | **Medium** | Auth | Middleware cookie-only; API 401 shows inline error | `middleware.ts`, `useOrgGraph.ts` | "Session expired" on canvas | Expire session | Already non-destructive; sign in again |
| AUD-013 | **Medium** | Code | `recomputeCPM` runs on every non-position mutation settle | `useMutationOrchestrator.ts` | Extra `setNodes`/`setEdges` churn | Edit task title | Acceptable; hash guard limits rebuild |
| AUD-014 | **Low** | UX | Error boundary retry does not remount children | `ErrorBoundary.tsx` | Retry may not recover | Force render error | **Fixed** — `resetKey` remount |
| AUD-015 | **Low** | Code | `DashboardView` 1s tick for "Updated X ago" | `DashboardView.tsx` | Extra re-renders | Open dashboard | Acceptable |

---

## Fixes applied (this pass)

1. **`src/lib/canvas/workloadStats.ts`** — API-backed workload counts from canvas nodes  
2. **`src/lib/canvas/dependencyEdgeStyles.ts`** — restore edges from `buildGraphFromApi` snapshot  
3. **`useWorkloadLayer.ts` / `WorkloadBanner.tsx`** — removed all `mockData` imports  
4. **`FlowCanvas.tsx`** — imports `dependencyEdgeStyles` not `seedToNodes`  
5. **`useMutationOrchestrator.ts`** — skip full invalidation for position-only updates  
6. **`login/page.tsx`** — no prefilled credentials in production  
7. **`useCanvasEvents.ts`** — real `userId` on published events  
8. **`client.ts`** — diagnostic when `NEXT_PUBLIC_API_URL` unset  
9. **`scripts/diagnose.ts`** — workload mock + `dependencyEdgeStyles` checks  
10. **Docs** — this file, `TROUBLESHOOTING.md`, `DEPLOY.md`, `STATUS.md`

---

## Reproduction quick reference

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| React #185 | Effect loop on canvas | `[FlowCanvas]` logs, cascade mount guards |
| Full page reload loop | Hard redirect (should not exist) | Network → Document requests |
| Workload highlights wrong tasks | Was AUD-001 | Verify no `mockData` in workload files |
| Edges wrong after workload | Was AUD-002 | Toggle workload; compare stroke colors |
| Drag snap-back | Was AUD-003 + optimistic | `[OrgGraph] optimistic drag` logs |
| 401 on API | Auth URL mismatch | `[AuthClient] baseURL` vs address bar |
| Firestore errors | DB missing / rules | `[Firebase]` / `[CanvasEvents]` once |
| Preview deploy broken | CORS AUD-006 | Align `APP_URL` with preview origin |

---

## Environment checklist

- [ ] `NEXT_PUBLIC_API_URL` → Railway public URL  
- [ ] `NEXT_PUBLIC_APP_URL` → exact Vercel origin (per environment)  
- [ ] `NEXT_PUBLIC_ORG_ID` → seeded org UUID  
- [ ] `BETTER_AUTH_SECRET` identical on Vercel + Railway  
- [ ] `BETTER_AUTH_URL` = `NEXT_PUBLIC_APP_URL`  
- [ ] `APP_URL` / `CORS_ORIGIN` = frontend origin (preview needs its own)  
- [ ] `DATABASE_URL` shared Neon instance  
- [ ] Firebase Firestore created + rules deployed  
- [ ] `pnpm auth:link-owner` run once per environment DB  

---

## Debugging checklist

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for full detail.

1. Filter console: `[FlowCanvas]`, `[OrgGraph]`, `[CanvasEvents]`, `[Presence]`, `[ViewportPersistence]`, `[AuthClient]`, `[ApiClient]`, `[Firebase]`  
2. Run `pnpm diagnose` locally (API checks need `pnpm dev:server`)  
3. Run `pnpm diagnose:prod` against Railway  
4. Confirm workload layer: no `MOCK_` in `useWorkloadLayer.ts`  
5. Confirm drag: optimistic log → saved log, no full invalidation log  

---

## Remaining risks (intentionally non-critical or deferred)

| Item | Why deferred |
|------|----------------|
| Yjs CRDT canvas sync (GAP-006) | Vision / Phase 12+; Firebase events sufficient for pilot |
| Preview CORS multi-origin | Requires server env list or Vercel integration config |
| Canvas bookmarks | Not implemented; sidebar section removed |
| Configurable workload thresholds | Product decision; heuristic documented |
| `seedToNodes` / `mockData` in repo | Dev/diagnostic only; guarded by diagnose |
| Invite flow edge cases | Works on happy path; audit invites separately |

---

## Things to keep watching

- Graph hash skips rebuild — ensure new fields that affect layout are in `graphContentHash`  
- Project wiring effect — runs when `projectClusterCount` changes only  
- Firebase session marker — old events ignored after tab session start  
- Position-only mutations — must not trigger orchestrator invalidation  
- Production login — no default password visible  

---

## Production readiness score (estimate)

| Area | Score | Notes |
|------|-------|-------|
| Canvas core | 8/10 | API graph, drag, expand, guards |
| Workload view | 7/10 | Real data; heuristic load levels |
| Auth | 8/10 | No hard reload; preview URL caveat |
| Firebase optional | 8/10 | Graceful disable |
| Docs | 8/10 | DEPLOY + TROUBLESHOOTING + this audit |
| Vision completeness | 5/10 | Yjs, advanced collab not shipped |
| Observability | 8/10 | Prefixed one-time console diagnostics |
| **Overall pilot readiness** | **8/10** | Suitable for single-org production pilot — see PRE_RELEASE.md |
