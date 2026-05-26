# FlowCanvas — Live Project Status

> Auto-updated after each Cursor prompt session.  
> Last updated: Tuesday, May 26, 2026

## Current Phase: Phase 3 — Blocking Chain + Workload (COMPLETE)

**Status:** Phase 3 complete — project expand, CPM engine, cascade panel, workload layer

## Phase 1 Progress

- [x] Next.js bootstrap + path aliases (`@/*`)
- [x] Tailwind v4 full token config
- [x] Geist + JetBrains Mono fonts
- [x] App Shell (TopBar + LeftSidebar + CanvasArea + RightPanel)
- [x] ReactFlow mounted with dot-grid + MiniMap
- [x] Zustand stores (`canvas.store` + `ui.store`)
- [x] TypeScript types (`src/types/index.ts`)
- [x] Dark mode locked
- [x] Fastify packages installed (server code not written)
- [ ] Fastify server process + routes
- [ ] PostgreSQL + Drizzle schema + migrations
- [ ] better-auth JWT auth

## Phase 2 Progress

- [x] TaskCardNode, ProjectClusterNode, PhaseClusterNode, PersonAvatarNode
- [x] DependencyEdge + mock seed data (9 tasks, 3 projects)
- [x] Semantic zoom (Z0–Z3) + RightPanel task detail

## Phase 3 Progress

- [x] Project expand → spawns PhaseClusterNodes dynamically
- [x] Project collapse → removes phase nodes + connecting edges
- [x] CPM engine — topological sort, forward/backward pass, float computation
- [x] Cascade impact computation — BFS downstream traversal, delay estimation
- [x] CPM wired to seed data — `isCriticalPath` + `slackTime` from engine
- [x] CascadePanel — spring animation, chain cards, Escape dismiss, edge dimming
- [x] Workload heatmap layer — person avatars, task fade, overloaded edge highlight
- [x] WorkloadBanner — floating pill with overload count
- [x] TopBar workload toggle button

## Phase 4 Status: NOT STARTED

## File Inventory (UPDATED)

### `src/lib/cpm/`
| File | Status |
|------|--------|
| `types.ts` | ✅ |
| `engine.ts` | ✅ |
| `engine.test.ts` | ✅ (smoke test) |
| `index.ts` | ✅ |

### `src/lib/canvas/`
| File | Status |
|------|--------|
| `useSemanticZoom.ts` | ✅ |
| `useProjectExpand.ts` | ✅ |
| `useWorkloadLayer.ts` | ✅ |
| `seedToNodes.ts` | ✅ (CPM-enhanced tasks, centroid person nodes) |

### `src/components/panels/`
| File | Status |
|------|--------|
| `TaskDetailPanel.tsx` | ✅ (cascade computation wired) |
| `CascadePanel.tsx` | ✅ |

### `src/components/canvas/`
| File | Status |
|------|--------|
| `FlowCanvas.tsx` | ✅ |
| `CanvasArea.tsx` | ✅ (CascadePanel + WorkloadBanner) |
| `WorkloadBanner.tsx` | ✅ |
| `nodes/*` | ✅ |

### `server/`
EMPTY — backend pending

## Current Visual State

- Click any task → RightPanel shows full detail
- Click blocked task t4 → CascadePanel slides up from canvas bottom (t4 → t5 chain)
- Toggle **Workload** in TopBar → person avatars float at task centroids
- Zoom out (< 0.7) → project cluster pills; chevron expand spawns phase nodes
- Zoom in → 9 task cards with CPM-computed critical path edges

## Known Issues

1. Escape on CascadePanel dismisses cascade but keeps task selected (by design).
2. Deactivating workload layer re-runs semantic zoom visibility on next zoom change only for person nodes (toggle off hides persons immediately).
3. `stitch-reference/` HTML not present — UI built from prompt specs.

## Next Session: Prompt Set 4

**A)** Command Palette (S10) + keyboard shortcuts (⌘K, T, Escape)  
**B)** Phase 1 backend — Fastify + Drizzle + PostgreSQL  
**C)** Dashboard view (S9) — Recharts KPIs

**Recommended:** **A** — completes core canvas UX loop before backend or dashboard.
