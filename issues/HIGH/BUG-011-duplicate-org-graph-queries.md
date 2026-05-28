# [BUG-011] Duplicate org-graph TanStack Query subscribers

**Severity:** HIGH  
**Category:** Performance / Canvas  
**Status:** CONFIRMED  
**PRD Reference:** Section 6 — performance budget

## Symptom

Extra network/refetch churn; harder to reason about cache; amplifies BUG-001 when any subscriber refetches.

## Root Cause

Same `queryKey: ["org-graph", ORG_ID]` registered in:

| File | Purpose |
|------|---------|
| `src/lib/api/useOrgGraph.ts` | Hydrate canvas |
| `src/components/panels/TaskDetailPanel.tsx` line 110 | Panel data |
| `src/components/views/GanttView.tsx` | Gantt bars |
| `src/components/views/DashboardView.tsx` line 43 | Dashboard KPIs |

TanStack dedupes in-flight requests but each mount still subscribes to cache updates.

## Evidence

- Grep `queryKey: ["org-graph"` across `src/`

## Fix

- Keep **one** `useOrgGraph()` in `OrgGraphHydrator` (AppShell).
- Export graph via `useQueryClient().getQueryData` or small `useOrgGraphData()` selector hook that reads cache without refetch.
- Or lift graph into Zustand after first load.

## Impact

Amplifies reload loop; wasted renders on Gantt/Dashboard/Panel.

## Effort Estimate

**S** (1–2h)
