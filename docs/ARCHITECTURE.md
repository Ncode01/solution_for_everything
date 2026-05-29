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
| Graph rebuild | Content hash skips `setNodes` when API data unchanged |
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

## 10. Related documentation

| Doc | Topic |
|-----|-------|
| [API.md](./API.md) | REST contract |
| [CPM_ENGINE.md](./CPM_ENGINE.md) | Algorithm detail |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI rules |
| [DEPLOY.md](./DEPLOY.md) | Hosting |
| [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) | Hardening history |
