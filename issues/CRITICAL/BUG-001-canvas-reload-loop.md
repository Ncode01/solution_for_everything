# [BUG-001] Canvas flicker / graph reset loop

**Severity:** CRITICAL  
**Category:** Canvas / Performance  
**Status:** FIXED (Phase 11B — hash guard + mergeGraphNodes)  
**PRD Reference:** Section 5.2 — stable infinite canvas

## Symptom

Owner reports: *"Canvas gets reloaded every few seconds"* and *"half of the app is not functioning."* Nodes may flicker, viewport may jump, selections lost, pan/zoom feels unstable.

## Root Cause

**Partially different from initial hypothesis.** Zustand `setNodes` / `setEdges` in `canvas.store.ts` are **stable** function references (defined once in `create()`). Listing them in `useEffect` deps is not inherently an infinite loop.

**Confirmed contributing factors:**

1. **`useOrgGraph` full graph replace** (`src/lib/api/useOrgGraph.ts` lines 41–46) — on every `query.data` change, `buildGraphFromApi` builds a **new** nodes/edges array and calls `setNodes(nodes)` (not a functional merge). Any refetch or cache update resets ReactFlow state (positions, selection, expand state).

2. **Multiple `org-graph` query subscribers** — `useOrgGraph`, `TaskDetailPanel`, `GanttView`, `DashboardView` each call `useQuery({ queryKey: ["org-graph", ORG_ID] })`. TanStack Query dedupes network calls but cache updates still propagate; any `invalidateQueries` affects all.

3. **Firebase `invalidateQueries`** (`src/lib/firebase/useCanvasEvents.ts` lines 77–82, 113–115, 130–132) — `task_created`, `dependency_*`, `task_updated` (without payload), `task_archived` invalidate the full graph. `onSnapshot` can deliver buffered `added` events on subscribe.

4. **Cascade / semantic-zoom `setNodes` chains** — `FlowCanvas.tsx` (lines 67–154), `useSemanticZoom.ts` (lines 30–82) rewrite node arrays on zoom level, cascade, and project expand wiring.

5. **`fitView`** — `ReactFlow` `fitView={!skipInitialFitView}` can re-center when `skipInitialFitView` toggles after viewport restore (`useViewportPersistence.ts`).

## Evidence

- File: `src/lib/api/useOrgGraph.ts` lines 41–46
- File: `src/lib/firebase/useCanvasEvents.ts` lines 44–138
- File: `src/lib/canvas/buildGraphFromApi.ts` — always returns fresh `nodes` array
- Production API: `GET /api/graph/{orgId}` returns 9 tasks, 3 projects (healthy)
- `staleTime: 30_000` set but **invalidation bypasses stale time**

## Fix

**Primary (merge, don’t replace):**

```ts
// useOrgGraph.ts — only apply when graph content hash changes
const graphHashRef = useRef<string>("");
useEffect(() => {
  if (!query.data) return;
  const hash = JSON.stringify({
    tasks: query.data.tasks.map((t) => `${t.id}:${t.status}:${t.canvasX}:${t.canvasY}`),
    deps: query.data.tasks.flatMap((t) => t.dependencies),
  });
  if (hash === graphHashRef.current) return;
  graphHashRef.current = hash;
  const { nodes, edges } = buildGraphFromApi(query.data);
  setNodes((prev) => mergeGraphNodes(prev, nodes)); // preserve drag positions + hidden flags
  setEdges(edges);
}, [query.data, setNodes, setEdges]);
```

**Secondary:**

- Remove `setNodes`/`setEdges` from `useCanvasEvents` effect deps; use `useCanvasStore.getState().setNodes` inside handlers.
- Prefer `queryClient.setQueryData` patches over `invalidateQueries` for Firebase events when payload includes full task.
- Single org-graph hook at `AppShell` only; pass data via context or store.

## Impact

Blocks canvas stability (C-02), drag persistence (C-20), expand, workload layer, and perceived “half app broken.”

## Effort Estimate

**M** (2–4h)

## Verification

- Code fix: `mergeGraphNodes.ts` + `graphContentHash` in `useOrgGraph.ts`
- Re-test on production after deploy: Network tab should show one `/api/graph` fetch per hard refresh; canvas stable 60s+
