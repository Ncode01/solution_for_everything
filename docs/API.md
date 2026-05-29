# FlowCanvas REST API

**Base URL:** `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001` or `https://*.up.railway.app`)

**Health:** `GET /health` → `{ "status": "ok", "ok": true, "service": "flowcanvas-api", "timestamp": "..." }`

**Auth:** Mutations and viewport **save** require a Better Auth session cookie (`credentials: "include"`). The Fastify server validates cookies by calling `BETTER_AUTH_URL/api/auth/get-session`.

**Client:** `src/lib/api/client.ts` — throws `Error("UNAUTHORIZED")` on 401 (no page reload).

Types: `src/lib/api/types.ts`.

---

## Authentication behavior

| HTTP status | Body | Client behavior |
|-------------|------|-----------------|
| 401 | `{ "error": "Unauthorized" }` | Throws `UNAUTHORIZED`; UI shows sign-in / session message |
| 400 | `{ "error": "message" }` | Throws with message (toast or inline) |
| 404 | `{ "error": "..." }` | Throws (e.g. task not found) |
| Network | — | `Failed to fetch` or similar |

**Note:** `GET /api/graph/:orgId` does **not** call `requireSession` on the server. The Next.js app still requires login via middleware before users reach the UI. For pilot hardening, consider org-scoped auth on graph reads in a future release.

---

## Endpoints

### `GET /api/graph/:orgId`

Full organization graph for canvas hydration.

**Auth:** None at API layer (see note above).

**Response `200`:**

```json
{
  "org": { "id": "uuid", "name": "Acme", "slug": "acme" },
  "users": [ { "id": "...", "name": "...", "email": "...", "role": "owner", ... } ],
  "projects": [ { "id": "...", "name": "...", "color": "coral", "status": "active", ... } ],
  "phases": [ { "id": "...", "projectId": "...", "name": "Phase 1", "orderIndex": 0 } ],
  "tasks": [
    {
      "id": "...",
      "title": "...",
      "status": "in_progress",
      "priority": "medium",
      "projectId": "...",
      "phaseId": "...",
      "canvasX": 400,
      "canvasY": 300,
      "assigneeIds": ["user-uuid"],
      "dependencies": ["upstream-task-id"],
      "dependents": ["downstream-task-id"]
    }
  ],
  "dependencies": [
    { "upstreamTaskId": "...", "downstreamTaskId": "...", "type": "FS" }
  ]
}
```

**Errors:** `404` `{ "error": "Org not found" }`

---

### `GET /api/graph/:orgId/workload`

Per-user workload summary (server-side heuristic: `taskCount * 12.5`).

**Response `200`:** `{ "users": [ { "userId", "name", "loadPercent", "taskCount", "activeTaskIds", ... } ] }`

---

### `PATCH /api/graph/tasks/:taskId/status`

**Status:** `501 Not yet implemented — Phase 6`

Client may call this via `apiClient.updateTaskStatus`; prefer `PATCH /api/tasks/:taskId` with `{ "status": "..." }`.

---

### `GET /api/tasks/:taskId`

Single task record.

**Response `200`:** Task object (same shape as graph task).

**Errors:** `404` `{ "error": "Task not found" }`

---

### `POST /api/tasks`

Create task.

**Auth:** Session required.

**Body:**

```json
{
  "title": "New task",
  "projectId": "uuid",
  "phaseId": "uuid",
  "description": null,
  "status": "not_started",
  "priority": "medium",
  "effortEstimate": 8,
  "dueDate": "2026-06-01",
  "assigneeIds": ["user-uuid"],
  "canvasX": 500,
  "canvasY": 400
}
```

**Required:** `title`, `projectId`, `phaseId`

**Response `201`:** Created task.

**Errors:** `400` validation message.

---

### `PATCH /api/tasks/:taskId`

Update task (including position).

**Auth:** Session required.

**Body (all optional):** `title`, `description`, `status`, `priority`, `effortEstimate`, `dueDate`, `phaseId`, `assigneeIds`, `canvasX`, `canvasY`

**Status values:** `not_started` | `in_progress` | `blocked` | `in_review` | `done`

**Priority values:** `low` | `medium` | `high` | `critical`

**Response `200`:** Updated task.

**Client note:** Position-only PATCH skips full graph invalidation (optimistic cache).

---

### `DELETE /api/tasks/:taskId`

Archive task (soft delete via `archivedAt`).

**Auth:** Session required.

**Response `200`:** Archived task.

---

### `POST /api/tasks/:taskId/dependencies`

Add dependency: `upstreamTaskId` → this task (downstream).

**Auth:** Session required.

**Body:** `{ "upstreamTaskId": "uuid" }`

**Response `200`:**

```json
{ "dependencies": ["..."], "dependents": ["..."] }
```

**Errors:** `400` cycle or validation message.

---

### `DELETE /api/tasks/:taskId/dependencies/:upstreamTaskId`

Remove dependency edge.

**Auth:** Session required.

**Response `200`:** `{ "dependencies": [], "dependents": [] }`

---

### `GET /api/canvas/viewport/:orgId?authUserId=...`

Load saved pan/zoom for user.

**Query:** `authUserId` (required) — Better Auth user id.

**Response `200`:**

```json
{ "viewportX": 0, "viewportY": 0, "viewportZoom": 1 }
```

**Errors:** `400` missing `authUserId`; `404` no saved viewport (client fits to content).

**Auth:** No session on GET; non-critical feature.

---

### `PUT /api/canvas/viewport/:orgId`

Save viewport (debounced on client).

**Auth:** Session required.

**Body:**

```json
{
  "viewportX": 120,
  "viewportY": -40,
  "viewportZoom": 0.85,
  "authUserId": "better-auth-user-id"
}
```

**Errors:** `403` if `authUserId` ≠ session user.

---

### `POST /api/invites`

Create invite link (owner/admin flow).

**Auth:** Session required.

**Body:** `{ "orgId": "uuid", "email": "user@example.com", "role": "member" }`

**Response `201`:**

```json
{
  "invite": { ... },
  "inviteUrl": "https://app/invite/token",
  "token": "..."
}
```

---

### `GET /api/invites/:token`

Validate invite (public).

**Response `200`:** `{ "email", "role", "orgId", "expiresAt" }`

**Errors:** `404` expired or invalid.

---

### `POST /api/invites/:token/accept`

Accept invite after sign-up.

**Body:** `{ "authUserId": "...", "name": "Jane Doe" }`

**Response `200`:** `{ "domainUser": { ... } }`

---

### `GET /api/users/me?authUserId=...`

Resolve domain user for signed-in Better Auth user.

**Query:** `authUserId` (required)

**Response `200`:** Domain user row.

**Errors:** `404` `{ "error": "Domain user not linked" }` — run `pnpm auth:link-owner` in ops setup.

---

## Org intelligence (Phase 12)

Base prefix: `/api/orgs/:orgId`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/canvas-data` | — | Full graph + milestones, budgets, health, cross-links |
| GET | `/projects/cross-links` | — | All cross-project links for org |
| GET | `/projects/:projectId/budget` | — | Entries + `BudgetSummary` |
| POST | `/projects/:projectId/budget` | Session | Create budget line item |
| GET | `/projects/:projectId/milestones` | — | Milestones with `daysUntil` |
| POST | `/projects/:projectId/milestones` | Session | Create milestone |

`GET /api/graph/:orgId` returns the same extended payload as `/canvas-data`.

---

## Better Auth (Next.js, not Fastify)

Hosted on the Next.js app at `/api/auth/*` (see `src/lib/auth/`). Not duplicated here; session cookies are shared with the API via `credentials: "include"`.

---

## Error response shape

Fastify routes generally return:

```json
{ "error": "Human-readable message" }
```

The client maps this to `throw new Error(message)`.

---

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — data flow and mutations
- [DATA_MODELS.md](./DATA_MODELS.md) — schema
- [docs/.temp/API_CONTRACTS.md](./.temp/API_CONTRACTS.md) — **deprecated** WS-first draft
