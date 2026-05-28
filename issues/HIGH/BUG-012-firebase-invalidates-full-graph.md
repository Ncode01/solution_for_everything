# [BUG-012] Firebase events trigger full graph invalidation

**Severity:** HIGH  
**Category:** Canvas / Presence  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.9 — real-time updates

## Symptom

Canvas resets shortly after load or when another tab/user publishes events — matches “reload every few seconds” if Firestore has activity.

## Root Cause

`useCanvasEvents.ts` calls `queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] })` for:

- `task_created`
- `dependency_added` / `dependency_removed`
- `task_updated` (when no inline `apiTask` payload)
- `task_archived`

Each invalidation → refetch → `useOrgGraph` → full `setNodes` replace (BUG-001).

`onSnapshot` with `limit(20)` still replays recent `added` changes on first subscribe.

## Evidence

- File: `src/lib/firebase/useCanvasEvents.ts` lines 77–132

## Fix

- Prefer surgical updates: `setQueryData` + patch nodes/edges in store (already done for `task_status_changed` and `task_updated` with payload).
- Remove invalidation for events that can be handled locally.
- Ignore snapshot changes older than session start (track `snapshot.metadata.fromCache` / doc `createdAt`).

## Impact

Collaboration and multi-tab use destabilize canvas.

## Effort Estimate

**M** (2–4h)
