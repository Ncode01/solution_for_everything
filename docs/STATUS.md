# FlowCanvas — Live Project Status

> Auto-updated after each Cursor prompt session.  
> Last updated: Tuesday, May 26, 2026

## Current Phase: Phase 1 — Foundation

**Status:** IN PROGRESS — UI foundation complete, backend setup pending

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

## Phase 2 Status: NOT STARTED

## Phase 3 Status: NOT STARTED

## Phase 4 Status: NOT STARTED

## File Inventory

### `src/components/ui/`
| File | Status |
|------|--------|
| `AppShell.tsx` | ✅ |
| `TopBar.tsx` | ✅ (wired to `useUIStore`) |
| `LeftSidebar.tsx` | ✅ (placeholder data) |
| `RightPanel.tsx` | ✅ (empty state, `isOpen` prop) |
| `FlowCanvasLogo.tsx` | ✅ |

### `src/components/canvas/`
| File | Status |
|------|--------|
| `CanvasWrapper.tsx` | ✅ (`ReactFlowProvider`) |
| `FlowCanvas.tsx` | ✅ (Background + MiniMap) |
| `CanvasArea.tsx` | ✅ |

### `src/lib/`
| File | Status |
|------|--------|
| `providers.tsx` | ✅ |
| `canvas/useSemanticZoom.ts` | ✅ (level tracking only) |

### `src/stores/`
| File | Status |
|------|--------|
| `canvas.store.ts` | ✅ |
| `ui.store.ts` | ✅ |

### `src/types/`
| File | Status |
|------|--------|
| `index.ts` | ✅ |

### `src/app/`
| File | Status |
|------|--------|
| `layout.tsx` | ✅ |
| `page.tsx` | ✅ (`AppShell`) |
| `globals.css` | ✅ |

### `server/`
EMPTY — Phase 1 backend pending (Fastify deps installed in package.json)

### `stitch-reference/`
README only — add S1–S11 HTML manually

## Installed Stack (versions from lockfile)

- Next.js 16.2.6
- React 19.2.6
- @xyflow/react 12.10.2
- Tailwind CSS 4.3.0
- Zustand 5.0.13
- Fastify 5.8.5 (not bootstrapped)

## Known Issues

1. `create next-app` could not run in non-empty directory — Next.js was installed manually (equivalent outcome).
2. Right panel hidden by default (`isRightPanelOpen: false`) — toggle wiring for task select comes in Phase 2.
3. Dashboard/Gantt tabs show placeholder text (by design until Phase 4/5).
4. `stitch-reference/S1-app-shell.html` not present — shell built from docs + design tokens.

## Next Session

**Option A:** Phase 1 backend — Fastify server entry, Drizzle schema, PostgreSQL, better-auth  
**Option B:** Phase 2 canvas nodes — `TaskCardNode` + mock seed data on canvas  
**Option C:** Add Stitch HTML to `stitch-reference/` and refine shell to pixel-match S1

**Recommended:** **B** — validates ReactFlow + design system with visible nodes before backend complexity.
