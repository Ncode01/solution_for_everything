# FlowCanvas — Live Project Status

> Auto-updated after each Cursor prompt session.  
> Last updated: Tuesday, May 26, 2026

## Current Phase: Phase 2 — Canvas Nodes (COMPLETE)

**Status:** Phase 2 complete — canvas nodes, seed data, semantic zoom, task detail panel

## Phase 1 Progress

- [x] Next.js bootstrap + path aliases (`@/*`)
- [x] Tailwind v4 full token config (`tailwind.config.ts` + `@config` in globals)
- [x] Geist (next/font) + JetBrains Mono (Google Fonts)
- [x] App Shell (TopBar + LeftSidebar + CanvasArea + RightPanel)
- [x] ReactFlow mounted with dot-grid + MiniMap
- [x] Zustand stores (`canvas.store` + `ui.store`)
- [x] TypeScript types (`src/types/index.ts`)
- [x] Dark mode locked (`html.dark`, no toggle)
- [x] Fastify packages installed (server code not written)
- [ ] Fastify server process + routes
- [ ] PostgreSQL + Drizzle schema + migrations
- [ ] better-auth JWT auth
- [ ] Stitch HTML files in `/stitch-reference/`

## Phase 2 Progress

- [x] TaskCardNode — status dot, priority chip, assignee avatars, blocked pulse, critical path bar
- [x] ProjectClusterNode — accent bar, progress bar, expand chevron
- [x] PhaseClusterNode — completion bar, task count
- [x] PersonAvatarNode — load ring, load level color (workload layer only)
- [x] DependencyEdge — bezier with arrows, gold on critical path, dashed on blocked
- [x] Mock seed data — 3 projects, 4 users, 9 tasks, dependency graph
- [x] Semantic zoom — Z0 shows projects, Z1 shows phases, Z2/Z3 shows tasks
- [x] RightPanel task detail — status, priority, assignees, CPM info, dependency list
- [x] Node click → panel open (`selectedNodeId` + `isRightPanelOpen`)

## Phase 3 Status: NOT STARTED

## Phase 4 Status: NOT STARTED

## File Inventory (UPDATED)

### `src/components/ui/`
| File | Status |
|------|--------|
| `AppShell.tsx` | ✅ |
| `TopBar.tsx` | ✅ |
| `LeftSidebar.tsx` | ✅ |
| `RightPanel.tsx` | ✅ (TaskDetailPanel + slide transition) |
| `FlowCanvasLogo.tsx` | ✅ |

### `src/components/canvas/`
| File | Status |
|------|--------|
| `CanvasWrapper.tsx` | ✅ |
| `FlowCanvas.tsx` | ✅ (nodeTypes + edgeTypes, seed on mount) |
| `CanvasArea.tsx` | ✅ |
| `nodes/TaskCardNode.tsx` | ✅ |
| `nodes/ProjectClusterNode.tsx` | ✅ |
| `nodes/PhaseClusterNode.tsx` | ✅ |
| `nodes/PersonAvatarNode.tsx` | ✅ |
| `nodes/DependencyEdge.tsx` | ✅ |

### `src/components/panels/`
| File | Status |
|------|--------|
| `TaskDetailPanel.tsx` | ✅ |

### `src/lib/`
| File | Status |
|------|--------|
| `providers.tsx` | ✅ |
| `canvas/useSemanticZoom.ts` | ✅ (visibility + workload layer + Z3 expand) |
| `canvas/seedToNodes.ts` | ✅ |
| `seed/mockData.ts` | ✅ |

### `src/stores/`
| File | Status |
|------|--------|
| `canvas.store.ts` | ✅ |
| `ui.store.ts` | ✅ |

### `src/types/`
| File | Status |
|------|--------|
| `index.ts` | ✅ |

### `server/`
EMPTY — Phase 1 backend pending

### `stitch-reference/`
README only — add S1–S11 HTML manually

## Current Visual State

- Canvas shows 9 task cards connected by bezier dependency edges
- Critical path: t1→t2→t5 in gold edges
- Blocked task t4 has red pulsing border + dashed incoming edge
- RightPanel opens on task click with full detail
- Zoom out → project cluster pills appear, task cards hide
- Zoom in → task cards visible, clusters hide
- Z3 (zoom ≥ 1.5) expands task cards with description, due date, effort

## Known Issues

1. Phase cluster nodes not yet spawned when a project expands (expand chevron toggles state only).
2. Person avatar nodes seeded but only visible when `activeLayer === 'workload'`.
3. `stitch-reference/` HTML not present — nodes built from prompt specs + design tokens.

## Next Session: Prompt Set 3

Goal options:

**A)** Phase 3 — Blocking Chain Cascade View (S7) + Workload Heatmap Layer (S8)  
**B)** Phase 1 backend — Fastify + Drizzle + PostgreSQL (replace mock data with real API)  
**C)** Command Palette (S10) + keyboard shortcuts

**Recommended:** **A** — builds on visible canvas nodes and edges; validates workload layer and blocking UX before backend.
