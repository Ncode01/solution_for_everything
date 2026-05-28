# [BUG-010] Node drag positions not persisted to API

**Severity:** HIGH  
**Category:** Canvas / API  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.2 — spatial canvas state

## Symptom

User drags a task card on canvas; position appears correct until graph refetch or reload — node snaps back to DB `canvasX`/`canvasY`.

## Root Cause

No `onNodeDragStop` / `onNodesChange` handler persists position to `PATCH /api/tasks/:id` with `canvasX`/`canvasY`.

`FlowCanvas.tsx` uses `onNodesChange` only with `applyNodeChanges` locally. `useTaskMutations` supports `canvasX` in create/update body but nothing calls it on drag.

## Evidence

- Grep: no `onNodeDrag` in `src/components/canvas/`
- `buildGraphFromApi.ts` line 150 — position from API only
- Server tasks route likely supports patch (verify in 11B)

## Fix

```ts
// FlowCanvas.tsx — debounced save on drag end
const onNodeDragStop = useCallback((_e, node) => {
  if (!node.id.startsWith("task-")) return;
  const taskId = node.id.replace("task-", "");
  void updateTask.mutate({ id: taskId, canvasX: node.position.x, canvasY: node.position.y });
}, [updateTask]);
```

Add to `ReactFlow` props. Debounce 300ms if using `onNodesChange` position type.

## Impact

C-20 NOT_IMPLEMENTED; collab / spatial workflow broken.

## Effort Estimate

**S** (1–2h)
