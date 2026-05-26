# Critical Path Method Engine

## Locations
| Runtime | Path | Role |
|---------|------|------|
| Client | `src/lib/cpm/compute.ts` | Instant UI feedback (&lt; 10ms target @ 200 tasks) |
| Server | `server/graph/cpm.ts` | Authoritative recompute + WS broadcast (&lt; 50ms @ 500 tasks) |

Both implementations must be **pure functions** with identical output shape. Client may run optimistically; server wins on conflict.

---

## Types

```typescript
type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'in_review' | 'done'

type CPMGraph = {
  tasks: Array<{
    id: string
    effortEstimate: number   // hours or story points — consistent per org
    status: TaskStatus
    dueDate?: Date
  }>
  dependencies: Array<{
    upstreamId: string
    downstreamId: string
    type: 'FS' | 'FF' | 'SS'   // Finish-Start, Finish-Finish, Start-Start
  }>
}

type CPMResult = {
  criticalPath: string[]                    // task IDs, ordered along path
  taskFloats: Record<string, number>        // slack per task (same units as effort)
  projectDuration: number                   // critical path length
  cascadeRisks: Array<{
    blockedTaskId: string
    estimatedDelay: number
    affectedTaskIds: string[]
  }>
}
```

---

## Algorithm

### 1. Build adjacency
Construct forward and reverse adjacency lists from `dependencies`.

### 2. Topological sort (Kahn's algorithm)
- In-degree count per task
- BFS queue starting at in-degree 0
- If processed count &lt; task count → **cycle detected** → throw `CPMCycleError`

### 3. Forward pass
For each task `t` in topological order:
- `earlyStart[t] = max(earlyFinish[u])` for all upstream `u`, or `0` if none
- For dependency types:
  - **FS:** upstream `earlyFinish`
  - **SS:** upstream `earlyStart`
  - **FF:** upstream `earlyFinish - effort[t]` (lag handled in v2)
- `earlyFinish[t] = earlyStart[t] + effort[t]`

### 4. Backward pass
Reverse topological order:
- `lateFinish[t] = min(lateStart[d])` for all downstream `d`, or `projectDuration` if none
- `lateStart[t] = lateFinish[t] - effort[t]`

### 5. Float
`float[t] = lateStart[t] - earlyStart[t]`

### 6. Critical path
All tasks where `float[t] === 0`. Order by topological index for stable edge rendering.

### 7. Cascade risks (blocking analysis)
For each task with `status === 'blocked'`:
- Walk downstream dependents via BFS
- `estimatedDelay` = sum of critical-path effort downstream of blocker
- Emit `cascadeRisks` entry for UI (`BlockingChainOverlay`, `CascadeImpactPanel`)

---

## Trigger Conditions
Re-run CPM when:
- `task.status` → `blocked` or `done`
- `task.effortEstimate` changes
- Dependency added or removed
- `task.dueDate` changes (may affect display priority, not float math in v1)

**Never** call from React components — invoke from Zustand store actions and server event queue.

---

## Integration

### Client flow
1. User mutates task → store updates optimistically
2. `computeCPM(graph)` → `CPMResult`
3. Patch node `data`: `{ isCriticalPath, slackTime, cascadeRisk }`
4. `setNodes` shallow update — preserve positions
5. Toggle `CriticalPathEdge` visibility when `activeLayer === 'criticalPath'`

### Server flow
1. WS `TASK_UPDATE` / `DEPENDENCY_*` → DB write
2. Queue CPM job (do not block WS thread)
3. `computeCPM` → persist `is_critical_path`, `slack_time` on tasks
4. Broadcast `CPM_RESULT` to org room

---

## Errors

| Error | When | Client UX |
|-------|------|-----------|
| `CPMCycleError` | Circular dependency | Inline edge error, block save |
| `CPMEmptyGraphError` | Zero tasks | No-op, empty result |

---

## Performance Targets

| Scale | Client | Server |
|-------|--------|--------|
| 200 tasks | &lt; 10ms | &lt; 25ms |
| 500 tasks | N/A (server authoritative) | &lt; 50ms |

Profile with Vitest benchmarks in `src/lib/cpm/compute.bench.ts` (Phase 3).

---

## Testing Requirements (Phase 3)
- Linear chain → single critical path
- Diamond graph → correct float on merge node
- Cycle → `CPMCycleError`
- Parallel branches → independent floats
- Blocked task → non-empty `cascadeRisks`
