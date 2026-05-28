# [BUG-002] Project expand uses MOCK_PROJECTS, not production API

**Severity:** CRITICAL  
**Category:** Canvas  
**Status:** FIXED (Phase 11B — API phases from TanStack cache)  
**PRD Reference:** Section 5.2 — PhaseCluster at semantic zoom Z1

## Symptom

Clicking expand on a **ProjectCluster** node may show wrong phases, no phases, or phases that don’t match production Neon data. Feature appears broken on live deploy.

## Root Cause

`useProjectExpand.ts` line 27:

```ts
const project = MOCK_PROJECTS.find((p) => p.id === projectId);
if (!project) return;
```

Production graph is built from API (`buildGraphFromApi`). Project IDs from API will **not** match `MOCK_PROJECTS` unless IDs happen to align with seed mock — production seed uses new UUIDs.

## Evidence

- File: `src/lib/canvas/useProjectExpand.ts` lines 25–28
- File: `src/lib/seed/mockData.ts` — `MOCK_PROJECTS` import
- Production `ORG_ID` seed creates API projects with UUIDs (`f7e104a8-...` org)

## Fix

Load phases from org graph data (TanStack cache or store), not mock:

```ts
// useProjectExpand.ts
const graph = queryClient.getQueryData<OrgGraphResponse>(["org-graph", ORG_ID]);
const project = graph?.projects.find((p) => p.id === projectId);
const phases = graph?.phases.filter((ph) => ph.projectId === projectId) ?? [];
```

Wire `onToggleExpand` using real `Phase` objects from API.

## Impact

C-06, C-07 partial; semantic zoom Z1 broken; project cluster interaction useless in production.

## Effort Estimate

**S** (1–2h)
