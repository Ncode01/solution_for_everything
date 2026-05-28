# FlowCanvas — Production Audit Report

**Date:** Wednesday, May 28, 2026  
**Version:** v1.0.0 (commit: `8d68792`, audit commit pending)  
**Audited by:** Cursor Agent (static code + production API; browser checklist code-inferred)  
**Live URL:** https://solutionforeverything.vercel.app  
**API:** https://flowcanvas-api-production.up.railway.app  

## Executive Summary

FlowCanvas v1.0.0 is **deployed and API-healthy** (6/6 `diagnose:prod`), but the **canvas experience is unstable** due to full graph replacements on every TanStack Query invalidation and Firebase event. The owner-reported reload loop is **confirmed in code** with a refined root cause (not unstable Zustand setter refs). **Project expand is broken in production** because it reads `MOCK_PROJECTS` instead of API data. Fix BUG-001, BUG-002, and BUG-013 in Phase 11B before new features.

## Score Card

| Category | Score | Notes |
|----------|-------|-------|
| Canvas stability | 3/10 | Full graph reset loop; expand uses mock IDs |
| Canvas interactions | 6/10 | Core pan/zoom/panel OK; drag save missing |
| Gantt view | 7/10 | Implemented; shares org-graph churn |
| Dashboard | 6/10 | Health + workload + panels; missing KPI/velocity |
| Auth & navigation | 8/10 | Better Auth live; login/session OK |
| API completeness | 8/10 | Graph, tasks, viewport, invites, auth |
| PRD vision alignment | 5/10 | Core canvas yes; milestones, E-mode, tabs no |
| **OVERALL** | **6/10** | Usable demo; canvas reliability is top risk |

## Bug Count by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 2 |
| LOW | 1 |
| Vision gaps | 7 |
| **Total tracked** | **16** |

## Top 5 Issues to Fix First

1. **BUG-001** — Canvas flicker / graph reset loop (`useOrgGraph.ts`, `useCanvasEvents.ts`)
2. **BUG-002** — Project expand uses mock data (`useProjectExpand.ts`)
3. **BUG-013** — `buildGraphFromApi` full replace (`buildGraphFromApi.ts`)
4. **BUG-012** — Firebase invalidates full graph (`useCanvasEvents.ts`)
5. **BUG-010** — Node positions not persisted on drag (`FlowCanvas.tsx`)

## Canvas Reload Bug — Verification

| Hypothesis | Result |
|------------|--------|
| `setNodes`/`setEdges` new ref every render | **NO** — Zustand actions are stable |
| `useEffect` deps include setters | **YES** — lines 41–46 `useOrgGraph.ts` |
| `query.data` / invalidation triggers full rebuild | **YES** — primary cause |
| Firebase `invalidateQueries` | **YES** — secondary trigger |
| Fix identified | **YES** — hash guard + merge nodes + reduce invalidation |

## Live Checklist Summary (code + API inferred)

### Canvas

| ID | Result |
|----|--------|
| C-01 | WORKS — 9 tasks from prod API |
| C-02 | **BROKEN** — reload loop |
| C-03–C-05 | WORKS — ReactFlow configured |
| C-06 | **BROKEN** — mock expand |
| C-07 | PARTIAL — semantic zoom implemented |
| C-08 | PARTIAL — CPM gold edges in builder |
| C-09 | PARTIAL — blocked dash on edge build |
| C-10–C-12 | WORKS — command registry |
| C-13–C-14 | WORKS — TaskDetailPanel |
| C-15–C-16 | **NOT_IMPLEMENTED** |
| C-17–C-18 | WORKS — deps + cascade |
| C-19 | WORKS — workload layer |
| C-20 | **BROKEN** — no drag persist |

### Gantt / Dashboard / Auth

| Area | Result |
|------|--------|
| G-01–G-05 | WORKS / PARTIAL — view exists; critical path styling TBD |
| D-01 | WORKS |
| D-02 | PARTIAL — 3 project cards not 4 KPIs |
| D-03 | WORKS — Recharts workload |
| D-04 | PARTIAL — health cards only |
| D-05 | **NOT_IMPLEMENTED** — no velocity chart |
| D-06 | WORKS — updated chip |
| A-01–A-06 | WORKS — prod auth deployed |

### Presence / Invite

| ID | Result |
|----|--------|
| P-01–P-02 | PARTIAL — needs live 2-tab verify |
| I-01–I-02 | WORKS — routes + TopBar (code) |

## PRD Vision Alignment (Sections 5.1–5.10)

| Section | Status |
|---------|--------|
| 5.1 App Shell | ✅ DONE |
| 5.2 Infinite Canvas | ⚠️ PARTIAL — no Milestone; stability issues |
| 5.3 Task Management | ✅ DONE |
| 5.4 Dependencies | ⚠️ PARTIAL — no E-mode; types not in UI |
| 5.5 Task Detail Panel | ⚠️ PARTIAL — Details only, no Comments/Subtasks |
| 5.6 Critical Path & Blocking | ✅ DONE |
| 5.7 Workload Layer | ✅ DONE |
| 5.8 Dashboard | ⚠️ PARTIAL |
| 5.9 Collaboration | ⚠️ PARTIAL — Firebase not Yjs |
| 5.10 Command Palette | ✅ DONE |

**PRD alignment: ~60%** (6 of 10 sections fully done, 4 partial)

## Recommended Fix Order

| Phase | Scope |
|-------|--------|
| **11B** | BUG-001, BUG-002, BUG-013, BUG-012 |
| **11C** | BUG-010, BUG-011, BUG-020, BUG-021 |
| **11D** | Vision gaps (Milestone, E-mode, Comments, Subtasks) |
| **11E** | LOW polish (BUG-030), GAP-005 verify, GAP-006 Yjs decision |
