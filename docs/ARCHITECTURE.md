# FlowCanvas — System Architecture

**Audience:** Engineers onboarding to the codebase.  
**Companion docs:** [API.md](./API.md), [ENV.md](./ENV.md), [DATA_MODELS.md](./DATA_MODELS.md).

---

## 1. High-level overview

FlowCanvas solves **org-wide visibility of work**: tasks, dependencies, and people on one spatial canvas, with Gantt and dashboard views. The browser runs a Next.js app; business data lives in PostgreSQL; optional Firebase adds presence and event fan-out.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User browser                                     │
│  ┌──────────────────┐   ┌─────────────┐   ┌──────────────────────────┐ │
│  │ Next.js 15       │   │ Zustand     │   │ @xyflow/react (canvas)   │ │
│  │ App Router       │   │ canvas + ui │   │ nodes, edges, viewport   │ │
│  └────────┬─────────┘   └──────┬──────┘   └────────────┬─────────────┘ │
│           │                    │                        │               │
│           │     TanStack Query (org graph cache)        │               │
│           └────────────────────┼────────────────────────┘               │
│                                │ REST (credentials: include)            │
│           ┌────────────────────┼────────────────────┐                   │
│           │ Better Auth      │ Firebase (optional)  │                   │
│           │ /api/auth/*      │ presence + events    │                   │
│           └────────────────────┴────────────────────┘                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
│ Vercel          │ │ Railway       │ │ Firebase        │
│ Next.js host    │ │ Fastify :3001 │ │ Firestore       │
│ + auth routes   │ │ REST API      │ │ (optional)      │
└────────┬────────┘ └───────┬───────┘ └─────────────────┘
         │                  │
         └────────┬─────────┘
                  ▼
           ┌──────────────┐
           │ Neon Postgres │
           │ (Drizzle ORM) │
           └──────────────┘
```

**Critical rule:** `server/` is a **separate Node process**. Never import it from `src/`.

**Not shipped:** Yjs CRDT / y-websocket canvas sync (see `issues/VISION_GAPS/GAP-006-yjs-crdt.md`). Collaboration today = REST + optional Firebase.

---

## 2. Client-side architecture

### Directory layout

| Path | Responsibility |
|------|----------------|
| `src/app/` | Routes: `/`, `/login`, `/invite/[token]` |
| `src/components/canvas/` | ReactFlow nodes, edges, handles only |
| `src/components/panels/` | Sidebar, task detail, command palette |
| `src/components/views/` | Dashboard, Gantt |
| `src/components/ui/` | AppShell, ErrorBoundary, toasts, primitives |
| `src/lib/api/` | `apiClient`, hooks, TanStack mutations |
| `src/lib/graph/` | `buildGraphFromApi`, merge, hash guard |
| `src/lib/cpm/` | Pure CPM (client-side recompute after mutations) |
| `src/stores/` | `canvas.store`, `ui.store` |

### Provider tree

```
ReactFlowProvider
  QueryClientProvider
    AppShell
      ProductionBootstrap   ← one-time [Audit] logs
      useOrgGraph()         ← hydrates canvas from API
      PresenceOrchestrator  ← optional Firebase
      { Canvas | Gantt | Dashboard }
```

### State ownership

| State | Owner | Notes |
|-------|-------|-------|
| `nodes`, `edges`, viewport | `useCanvasStore` | React Flow source of truth |
| `selectedNodeId`, `activeLayer` | `useCanvasStore` | |
| Org graph (tasks, projects, …) | TanStack Query | Key: org graph by `NEXT_PUBLIC_ORG_ID` |
| Panel open, active view, palette | `useUIStore` | Ephemeral UI |

---

## 3. Server-side architecture

```
server/
  index.ts              # Fastify + CORS + route registration
  routes/
    graph.ts            # GET graph, workload; status stub 501
    tasks.ts            # CRUD + dependencies
    canvas.ts           # Viewport GET/PUT
    invites.ts          # Invite create/validate/accept
    users.ts            # GET /me
  lib/auth.ts           # requireSession → Better Auth get-session
  db/                   # Drizzle schema, queries, mutations
```

**CPM:** Recomputed on the **client** after mutations settle (`useCPMSync` / `recomputeCPM`), not via a server queue in the current pilot.

**CORS:** Allows `APP_URL` and `http://localhost:*` with credentials.

---

## 4. Data flows

### 4.1 Graph load (API → canvas)

```
GET /api/graph/:orgId
  → TanStack Query cache
  → buildGraphFromApi() → Node[] + Edge[]
  → graphContentHash guard (skip rebuild if unchanged)
  → useCanvasStore.setNodes / setEdges
  → recomputeCPM() for critical path styling
```

Logs: `[Audit] Org graph loaded`, `[OrgGraph] graph content changed, rebuilding canvas` (dev).

### Canvas layout

See **[Canvas Layout System](#canvas-layout-system)** below for constants, zoom layers, and swimlane algorithm.

### 4.2 Mutations (UI → server → cache)

```
User edits task / drags node
  → useTaskMutations / orchestrator
  → optimistic cache update (positions: applyOptimisticTaskPosition)
  → PATCH /api/tasks/:id
  → on success: selective invalidation OR skip (position-only)
  → recomputeCPM on non-position settles
  → on failure: rollback + toast
```

Position-only body **does not** invalidate full graph (prevents drag snap-back).

### 4.3 Viewport (non-critical)

```
On load: GET viewport?authUserId=…
  → restore or fitView
  → logOnce viewport-restored | viewport-fit-default

On pan/zoom end: debounced PUT viewport
  → failures logged once; canvas still usable
```

### 4.4 Firebase presence (optional)

```
Firebase configured?
  → PresenceOrchestrator writes cursor/viewport heartbeats
  → RemoteCursors in UI
On error:
  → logOnce [Presence] / [Firebase]
  → disable feature; no crash
```

### 4.5 Firebase events (optional)

```
Task created/updated on client
  → Firestore event doc (real auth userId)
Other clients:
  → listener may invalidate or patch (with session marker for stale events)
```

---

## 5. Auth and session

```
User signs in at /login
  → Better Auth sets HTTP-only session cookie on app origin
Middleware (src/middleware.ts)
  → no cookie → redirect /login
  → cookie on /login → redirect /
API calls (src/lib/api/client.ts)
  → credentials: "include"
Fastify requireSession
  → forwards Cookie to BETTER_AUTH_URL/api/auth/get-session
401
  → throw UNAUTHORIZED (no window.location reload)
  → Canvas overlay / views show sign-in or retry
```

---

## 6. Error handling strategy

| Layer | Behavior |
|-------|----------|
| **ErrorBoundary** | Catches render errors; retry remounts via `resetKey` |
| **Canvas overlay** | Graph/query failures; retry + sign in |
| **Dashboard / Gantt** | `ViewStatusPanel` error + Try again |
| **Mutations** | Toast on failure; optimistic rollback for drag |
| **Firebase** | Disable feature; one-time console warning |
| **Viewport** | Silent degradation |
| **Non-critical** | Documented in STATUS; user not blocked |

---

## 7. Diagnostic strategy

| Mechanism | Purpose |
|-----------|---------|
| `logOnce` / `logDevOnce` | One line per key per session (`src/lib/diagnostics.ts`) |
| `ProductionBootstrap` | Boot + env warnings `[Audit]` |
| `pnpm diagnose` | Repo + DB + API smoke (local) |
| `pnpm diagnose:prod` | Production API smoke |

**Prefixes:** `[Audit]`, `[ApiClient]`, `[OrgGraph]`, `[ViewportPersistence]`, `[FlowCanvas]`, `[Firebase]`, `[Presence]`, `[CanvasEvents]`, `[DeadEnd]`, `[UI]`

Full table: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md), [PRE_RELEASE.md](./PRE_RELEASE.md).

**Debug command palette:** `Log Current Canvas State` — `NODE_ENV !== "production"` only.

---

## 8. Performance considerations

| Topic | Approach |
|-------|----------|
| Graph rebuild | Content hash skips `setNodes` when API data unchanged (includes task + project + milestone positions) |
| Drag save | Debounced PATCH; optimistic position in query cache |
| Invalidation | Position-only mutations skip full graph refetch |
| Project wiring | Effect depends on `projectClusterCount`, not full `nodes` |
| Cascade / edge restore | Mount guards prevent initial `setNodes` churn |
| Dashboard clock | 1s interval for “Updated ago” — acceptable cost |
| Firebase | Throttled heartbeats (see DEPLOY.md quotas) |

---

## 9. Security (pilot)

- Org data scoped by `NEXT_PUBLIC_ORG_ID` on client
- Mutations require session on API
- Graph GET unauthenticated at API layer — mitigated by Next middleware for UI; tighten in Phase 12+ if needed
- No secrets in client bundle (`NEXT_PUBLIC_*` only)
- No canvas state in `localStorage`

---

## 10. Health Score Engine

**Location:** `src/lib/health-score.ts` (client) and `server/lib/health-score.ts` (API; keep in sync)

**Inputs:**

- Project tasks (`status`, `priority`, `dueDate`)
- Project milestones (`date` for `daysToNextMilestone`)
- `BudgetSummary | null` (from `budget_entries`)

**Output:** `ProjectHealthScore` — `score` 0–100, `grade` green/amber/red, penalty counts, `budgetBurnPercent`, `daysToNextMilestone`.

**Penalty weights (tunable):**

| Rule | Penalty |
|------|---------|
| Each blocked **critical** task | −15 (max −45) |
| Each overdue non-done task | −8 (max −30) |
| Expenditure &gt; 90% of income | −15 |

Pure function — no database calls. Computed in `getOrgGraph` per project for API responses and again on the client when building clusters.

---

## 11. Cross-Project Intelligence

**Table:** `cross_project_links` — org-level dependencies between projects (not task edges).

**Canvas:** `CrossProjectEdge` (`crossProject` edge type) connects `project:{sourceId}` → `project:{targetId}` with type-specific color and mid-edge label.

**Semantic zoom:** Cross-project edges are **visible only at Z0** (org overview). `useSemanticZoom` sets `hidden: true` on these edges at Z1–Z3.

**Types:** `launches_at`, `talent_pipeline`, `venue_shared`, `funds_from`, `collaboration`.

**API:** Included in `GET /api/graph/:orgId` and `GET /api/orgs/:orgId/canvas-data`. Dedicated list: `GET /api/orgs/:orgId/projects/cross-links`.

---

## Canvas Layout System

### Files

- `src/lib/canvas/layout.ts` — all constants and pure position functions (no React / no `@xyflow`)
- `src/lib/canvas/buildGraphFromApi.ts` — calls layout functions to assign positions to every node type
- `src/lib/canvas/mergeGraphNodes.ts` — preserves DB-saved positions via `_savedToDb`; zero-coordinate nodes receive fresh layout positions

### Semantic Zoom

Semantic zoom **no longer hides nodes**. All node types are always visible at every zoom level. `useSemanticZoom` only updates `zoomLevel` in the store (used by node components for conditional rendering of fine detail — e.g. showing the expand toggle on `ProjectClusterNode` only at Z1+).

The only hidden nodes are:

- `personAvatar` nodes: start hidden, shown when a project is expanded via `useProjectExpand`.

### Zoom layers

| Level | Zoom range | UI detail (not visibility) | Layout pattern |
|-------|------------|---------------------------|----------------|
| Z0 | &lt; 0.3 | compact project cards | hex-offset 3-col grid |
| Z1 | 0.3–0.7 | expand chevron on projects | phase fan-out columns |
| Z2 | 0.7–1.5 | full task swimlanes | phase swimlane columns |
| Z3 | &gt; 1.5 | expanded task cards | phase swimlane columns |

### Task swimlane algorithm

- Tasks within a project band are grouped by phase (sorted by `orderIndex`).
- Each phase occupies a column: `x = projectOriginX + phaseIndex × (250 + 60)`.
- Tasks flow down the column: `y = bandOriginY + rowIndex × 130`.
- After `TASKS_PER_COL` (5) tasks, a new sub-column starts within the same phase.
- Critical path tasks nudge up 18px; high-slack tasks (≥ 3 days) nudge down 18px.
- Zero-coordinate tasks (never saved) always receive a fresh layout position.
- Non-zero tasks always keep their DB-saved position.

### Phase header nodes

- id prefix: `phase-header-`
- type: `phaseHeader`
- Not draggable, not selectable
- Always visible; labels render at all zoom levels

### Swimlane background bands

- `SwimlaneBands.tsx` renders faint tinted rectangles in canvas space via `ViewportPortal`
- One band per project, color-coded by project accent color
- Opacity may vary by zoom in the component; bands are not hidden via `node.hidden`

### deCollide

Runs on `taskCard` nodes only with 60px Manhattan threshold — nudges overlapping cards apart vertically.

---

## Node Selection & Camera Focus

### selectNode flow (exact sequence)

1. `selectNode(id, type)` called (from node onClick or CommandPalette)
2. Store sets `selectedNodeId` + `selectedNodeType` immediately
3. If the target node is `hidden: true` in the store, `setNodes` flips it to `hidden: false` before the focus call (handles person nodes)
4. After **80ms** (React commit window), `focusCanvasNode(id)` is called
5. `focusCanvasNode` reads `node.position` + `node.measured` dimensions from the ReactFlow instance, computes the center in flow coordinates, and calls `instance.setCenter(cx, cy, { zoom: 1.1, duration: 420 })`
6. Viewport is synced back to the canvas store

### Why fitView({nodes}) is NOT used for focus

`fitView({nodes:[{id}]})` silently no-ops if the target node is hidden. It also requires the node to be in the ReactFlow internal registry with measured dimensions. `setCenter` with manually-computed coordinates is more reliable and works immediately after unhiding.

**Programmatic selection:** Pass `{ focus: false }` as the third argument to `selectNode` when the camera should not pan (e.g. internal cross-links).

**`focusCanvasPoint(x, y)`:** Explicit center+zoom when the caller knows coordinates.

**Visual feedback:** `FlowCanvas` applies a white outline ring (`outline: 2px solid rgba(255,255,255,0.25)`) on the selected node.

---

## Position Persistence

| Node type | Save hook | Debounce | Cache strategy |
|-----------|-----------|----------|----------------|
| Task | `useUpdateTaskMutation` | 300ms | `applyOptimisticTaskPosition` |
| Project | `useUpdateProjectPositionMutation` | 400ms | `applyOptimisticProjectPosition` |
| Milestone | `useUpdateMilestonePositionMutation` | 400ms | `applyOptimisticMilestonePosition` |

All position saves: optimistic org-graph cache update, rollback canvas nodes on error, **no** full graph invalidation on success.

**Stale refetch guard:** `graphContentHash` in `useOrgGraph.ts` includes task, project, and milestone positions. Org-graph `staleTime` is **60s** to reduce background refetch races during drag.

---

## 12. Related documentation

| Doc | Topic |
|-----|-------|
| [API.md](./API.md) | REST contract |
| [CPM_ENGINE.md](./CPM_ENGINE.md) | Algorithm detail |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI rules |
| [DEPLOY.md](./DEPLOY.md) | Hosting |
| [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) | Hardening history |
