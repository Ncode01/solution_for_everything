# FlowCanvas Development Roadmap

> **Phase 1 status:** IN PROGRESS — UI foundation complete, backend setup pending

## Phase 1 — Foundation (Week 1–2)
**Goal:** Running app shell with empty canvas

- [x] Next.js 15 + TypeScript setup with path aliases (`@/*`)
- [x] Tailwind v4 config with full Stitch token set (`tailwind.config.ts`)
- [x] Geist + JetBrains Mono font loading
- [x] App Shell layout (TopBar + LeftSidebar + Canvas + RightPanel) — **S1 reference**
- [x] ReactFlow basic setup with dot-grid background
- [x] Zustand canvas store (nodes, edges, viewport, selectedNodeId)
- [ ] Fastify server setup with Drizzle + PostgreSQL
- [ ] better-auth JWT login/register
- [x] Dark mode locked (no toggle — dark only)
- [ ] Place Stitch HTML exports in `/stitch-reference/`

## Phase 2 — Canvas Core (Week 3–4)
**Goal:** Task nodes on canvas, dependency edges, basic CRUD

- [ ] `TaskCardNode` (Z2) with status glow — **no backdrop-filter**
- [ ] `ProjectClusterNode` + `PhaseClusterNode`
- [ ] `DependencyEdge` + `BlockedEdge` + `CriticalPathEdge`
- [ ] Semantic zoom switching (Z0/Z1/Z2 via `node.hidden`)
- [ ] Task creation (press `T` → place on canvas)
- [ ] Connect tool (`E` → draw edge between nodes)
- [ ] Right panel `TaskDetailPanel` (static, tabs from **S11**)
- [ ] REST API for task CRUD + dependency CRUD
- [ ] Fix Z2 sidebar — enforce S1 shell everywhere

## Phase 3 — Intelligence (Week 5–6)
**Goal:** CPM engine + workload layer live

- [ ] CPM algorithm in `src/lib/cpm/compute.ts` (unit tested)
- [ ] `CriticalPathEdge` rendering from CPM result
- [ ] `SlackTimeBadge` on non-critical tasks
- [ ] `BlockingChainOverlay` (cascade view — **S7**)
- [ ] `PersonWorkloadCard` + `LoadRing` SVG (**S8**)
- [ ] Workload heatmap layer toggle
- [ ] WebSocket server setup (Fastify + org rooms)
- [ ] CPM server-side recompute + `CPM_RESULT` broadcast

## Phase 4 — Collaboration & Polish (Week 7–8)
**Goal:** Multi-user, command palette, dashboard

- [ ] Yjs integration for canvas node position sync
- [ ] Live cursor presence (`PersonAvatarNode`)
- [ ] Command palette (⌘K) with fly-to — **S10**
- [ ] Dashboard page (Recharts KPIs + charts — **S9**)
- [ ] Notification center (WebSocket-driven)
- [ ] Canvas bookmarks
- [ ] Activity feed in right panel
- [ ] `MilestoneNode` + milestone calendar strip

## Phase 5 — Hardening (Post-MVP)
- [ ] ReactFlow virtualization for 500+ nodes
- [ ] Cross-project dependency edges at Z0
- [ ] Gantt toggle (auto-generated from CPM dates)
- [ ] Export to shareable read-only link
- [ ] Mobile companion (task feed only, no canvas)

---

## Documentation Gate
- [x] `.cursor/rules/*.mdc`
- [x] `docs/*`
- [x] Next.js bootstrap + Phase 1 UI dependencies installed
- [ ] `/stitch-reference/` — user drops 11 HTML exports
