# FlowCanvas — API Contracts (ARCHIVED)

> **Superseded by [../API.md](../API.md).** This draft described WebSocket-first flows and incorrect paths. Do not use for production integration.

---

# FlowCanvas — API Contracts (original)

**Base URL (REST):** `http://localhost:3001`  
**WebSocket:** `ws://localhost:3001/ws`  
**Auth:** `Authorization: Bearer <jwt>` on REST; token in WS connect

All responses: `{ data: T }` on success, `{ error: { code, message } }` on failure.

---

## REST Endpoints

### GET `/api/org/:orgId/graph`
Full canvas hydration payload.

**Response `data`:**
```typescript
{
  projects: Array<{
    id: string
    name: string
    color: string
    status: string
    canvasX: number | null
    canvasY: number | null
    phases: Array<{
      id: string
      name: string
      orderIndex: number
      canvasX: number | null
      canvasY: number | null
      tasks: Array<Task>  // see DATA_MODELS.md
    }>
  }>
  dependencies: Array<{
    upstreamTaskId: string
    downstreamTaskId: string
    type: 'FS' | 'FF' | 'SS'
  }>
}
```

---

### GET `/api/org/:orgId/workload`
Person workload aggregation for heatmap layer.

**Response `data`:**
```typescript
{
  users: Array<{
    userId: string
    name: string
    avatarUrl: string | null
    loadPercent: number      // 0-100+
    taskCount: number
    activeTaskIds: string[]
    canvasX: number          // avatar position
    canvasY: number
  }>
}
```

---

### POST `/api/tasks`
Create task.

**Body:**
```typescript
{
  phaseId: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  effortEstimate?: number
  dueDate?: string
  canvasX: number
  canvasY: number
  assigneeIds?: string[]
}
```

**Response:** `{ data: Task }` + triggers server CPM

---

### PATCH `/api/tasks/:id`
Partial update.

**Body:** Partial of task fields (any subset).

**Response:** `{ data: Task }` + CPM recompute

---

### POST `/api/dependencies`
Add dependency.

**Body:**
```typescript
{
  upstreamTaskId: string
  downstreamTaskId: string
  type: 'FS' | 'FF' | 'SS'
}
```

**Errors:** `409 CYCLE_DETECTED` if CPM cycle

---

### DELETE `/api/dependencies`
Remove dependency.

**Body:**
```typescript
{
  upstreamTaskId: string
  downstreamTaskId: string
}
```

---

### GET `/api/projects/:projectId/critical-path`
Current critical path for one project.

**Response `data`:**
```typescript
{
  criticalPath: string[]           // task IDs ordered
  taskFloats: Record<string, number>
  projectDuration: number
}
```

---

## WebSocket Protocol

### Envelope (all messages)
```typescript
{
  type: string
  payload: unknown
  orgId: string
  userId: string
  timestamp?: string   // ISO — server adds on outbound
}
```

### Client → Server (Inbound)

| type | payload |
|------|---------|
| `TASK_UPDATE` | `{ taskId: string, changes: Partial<Task> }` |
| `TASK_CREATE` | `{ phaseId: string, data: Omit<Task, 'id'> }` |
| `DEPENDENCY_ADD` | `{ upstreamId: string, downstreamId: string, depType: 'FS'\|'FF'\|'SS' }` |
| `DEPENDENCY_REMOVE` | `{ upstreamId: string, downstreamId: string }` |
| `CANVAS_MOVE` | `{ nodeId: string, x: number, y: number }` — debounce 500ms client-side |
| `CURSOR_MOVE` | `{ x: number, y: number, activeNodeId?: string }` — not persisted |

### Server → Client (Outbound)

| type | payload |
|------|---------|
| `TASK_UPDATED` | `{ task: Task }` |
| `TASK_CREATED` | `{ task: Task }` |
| `CPM_RESULT` | `{ criticalPath: string[], taskFloats: Record<string, number>, projectDuration: number, cascadeRisks: CascadeRisk[] }` |
| `PRESENCE_UPDATE` | `{ userId: string, cursor: { x: number, y: number }, activeNodeId?: string }` |
| `WORKLOAD_UPDATE` | `{ userId: string, loadPercent: number, taskCount: number }` |
| `DEPENDENCY_CHANGED` | `{ upstreamId, downstreamId, action: 'add'\|'remove' }` |
| `ERROR` | `{ code: string, message: string, ref?: string }` |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `FORBIDDEN` | 403 | Not in org |
| `NOT_FOUND` | 404 | Resource missing |
| `CYCLE_DETECTED` | 409 | Dependency creates cycle |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `INTERNAL_ERROR` | 500 | Unexpected |

---

## Client API Layer (`src/lib/api/`)

| Module | Responsibility |
|--------|----------------|
| `rest-client.ts` | Typed fetch wrappers |
| `ws-client.ts` | Connect, reconnect, message dispatch |
| `hooks/` | TanStack Query keys + mutations |

Query keys:
- `['org', orgId, 'graph']`
- `['org', orgId, 'workload']`
- `['project', projectId, 'critical-path']`

---

## Rate Limits (Production)

| Endpoint | Limit |
|----------|-------|
| `CANVAS_MOVE` WS | 10/sec per user |
| `CURSOR_MOVE` WS | 30/sec per user |
| REST mutations | 60/min per user |

---

## Versioning

Prefix none for v1. Breaking changes → `/api/v2` with parallel WS `version` field in envelope.
