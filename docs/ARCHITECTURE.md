# FlowCanvas — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (localhost:3000)                     │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │  Next.js 15  │  │   Zustand   │  │  @xyflow/react v12       │ │
│  │  App Router  │  │   stores    │  │  Canvas (THE product)    │ │
│  └──────┬───────┘  └──────┬──────┘  └───────────┬──────────────┘ │
│         │                 │                      │               │
│         │    TanStack Query (server state)       │               │
│         └────────────────┼──────────────────────┘               │
│                          │ REST + WebSocket                       │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│              Fastify Server (localhost:3001)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │ REST /api  │  │ WS /ws     │  │ CPM queue  │  │ better-auth │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────────────┘ │
│        └───────────────┴───────────────┘                          │
│                          │ Drizzle ORM                            │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │     16      │
                    └─────────────┘

Collaboration overlay (Phase 4):
  Yjs doc ←→ y-websocket ←→ Fastify WS (canvas positions, CRDT)
```

**Critical rule:** `server/` is a **separate Node process**. Never import it from `src/`.

---

## Frontend Architecture

### Directory responsibilities

| Path | Responsibility |
|------|----------------|
| `src/app/` | Next.js routes, layouts, providers |
| `src/components/canvas/` | ReactFlow nodes, edges, handles only |
| `src/components/panels/` | Sidebar, task detail, cascade panels |
| `src/components/dashboard/` | Recharts KPIs and charts |
| `src/components/ui/` | Primitives: Button, Badge, Chip, Avatar |
| `src/lib/cpm/` | Pure CPM algorithm |
| `src/lib/graph/` | Graph transforms, hydration helpers |
| `src/lib/api/` | REST client, WS client wrappers |
| `src/stores/` | Zustand: canvas, ui, user, projects |
| `src/types/` | Shared TypeScript types |

### Provider tree (target)
```
<ReactFlowProvider>          // app root — once
  <QueryClientProvider>
    <AuthProvider>
      <AppShell>
        {children}
      </AppShell>
    </AuthProvider>
  </QueryClientProvider>
</ReactFlowProvider>
```

### State ownership

| State | Owner | Notes |
|-------|-------|-------|
| nodes, edges, viewport | `useCanvasStore` | ReactFlow source of truth |
| selectedNodeId | `useCanvasStore` | Never derive from nodes |
| zoomLevel Z0–Z3 | `useCanvasStore` | Derived from viewport in effect |
| activeLayer | `useCanvasStore` | default \| workload \| criticalPath |
| tasks, projects (server) | TanStack Query | Hydrate into canvas on load |
| UI chrome (panels open) | `useUiStore` | Ephemeral |

### Semantic zoom pipeline
1. `useViewport()` returns `{ zoom }`
2. `useEffect` maps zoom → `Z0|Z1|Z2|Z3`
3. Store action sets `node.hidden` per type
4. ReactFlow re-renders visible set only — nodes stay mounted

---

## Backend Architecture

### Process
- **Port 3001** — Fastify v5
- **Plugins:** `@fastify/websocket`, CORS to `:3000`, JWT verify middleware
- **Org scoping:** Every query and WS room keyed by `orgId`

### Event-driven CPM
```
WS TASK_UPDATE → validate → DB transaction → enqueue CPM job
  → computeCPM → update task rows → broadcast CPM_RESULT + TASK_UPDATED
```
Never run CPM synchronously inside WS handler body.

### File layout
```
server/
  index.ts           # Fastify bootstrap
  routes/            # REST handlers
  ws/                # WebSocket connection + room manager
  graph/
    cpm.ts           # Server CPM (mirror of src/lib/cpm)
  db/
    schema.ts        # Drizzle schema
    migrations/
```

---

## Data Flow: Canvas Hydration

1. User opens `/canvas` (or org default route)
2. `GET /api/org/:orgId/graph` → projects, phases, tasks, dependencies, positions
3. `lib/graph/hydrate.ts` maps DB records → ReactFlow `Node[]` + `Edge[]`
4. `useCanvasStore.setNodes/setEdges`
5. Client `computeCPM` → patch node data for critical path styling

---

## Data Flow: Real-Time Edit

1. User drags task card → debounced `CANVAS_MOVE` WS (500ms)
2. User edits title in panel → `TASK_UPDATE` WS
3. Server persists → CPM queue → broadcast
4. All clients: merge `TASK_UPDATED`, apply `CPM_RESULT` to node data

---

## Authentication

- **better-auth** with JWT
- Access token in `Authorization: Bearer`
- WS handshake: token in query or first message
- Roles: `owner` | `admin` | `member` | `viewer` (viewer = read-only canvas)

---

## File Storage

- Cloudflare R2 for avatars and attachments (Phase 4+)
- Presigned upload URLs from Fastify

---

## Deployment (Future)

| Service | Host |
|---------|------|
| Next.js | Vercel or container |
| Fastify + WS | Fly.io / Railway (sticky sessions for WS) |
| PostgreSQL | Neon / RDS |
| R2 | Cloudflare |

---

## Security

- Org isolation on every DB query (`WHERE org_id = ?`)
- WS rooms: user must belong to org
- No canvas state in localStorage
- Input validation via Zod on all REST/WS payloads

---

## Related Docs

- [DATA_MODELS.md](./DATA_MODELS.md) — schema detail
- [API_CONTRACTS.md](./API_CONTRACTS.md) — REST + WS shapes
- [CPM_ENGINE.md](./CPM_ENGINE.md) — algorithm
- [SCREENS.md](./SCREENS.md) — UI mapping
