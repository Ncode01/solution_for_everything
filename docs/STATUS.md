# FlowCanvas — Live Project Status

> Auto-updated after each Cursor prompt session.  
> Last updated: Tuesday, May 26, 2026

## Current Phase: Phase 5 — Neon DB + API Hydration + Firebase Realtime

**Status:** Phase 5 code complete — awaiting manual Neon `.env.server` + seed + `NEXT_PUBLIC_ORG_ID`

## Phase 5 Progress

- [x] Neon-compatible Drizzle client (`@neondatabase/serverless` + `drizzle-orm/neon-http`)
- [x] Drizzle schema + `drizzle.config.ts` (loads `.env.server`)
- [x] Seed script (`pnpm db:seed`) — prints `ORG_ID` for `.env.local`
- [x] `getOrgGraph()` query + `GET /api/graph/:orgId`
- [x] Frontend API client + TanStack Query `useOrgGraph`
- [x] `buildGraphFromApi` — replaces mock graph hydration on mount
- [x] Canvas loading overlay + error states
- [x] Firebase SDK + `useCanvasEvents` (skips when env vars missing)
- [x] `firestore.rules` (deploy with `firebase deploy --only firestore:rules`)
- [x] Self-diagnostic script (`pnpm diagnose`)
- [ ] **Manual:** Create Neon project → set `DATABASE_URL` in `.env.server`
- [ ] **Manual:** `pnpm db:push` + `pnpm db:seed`
- [ ] **Manual:** Copy `ORG_ID` to `.env.local` as `NEXT_PUBLIC_ORG_ID`
- [ ] **Manual:** Firebase project + env vars + rules deploy
- [ ] better-auth JWT (Phase 6)
- [ ] Collaborative presence cursors (Phase 6)
- [ ] Task create/edit form (Phase 6)

## Phase 4B Progress (complete)

- [x] Escape chain, ReactFlow fitView, command palette polish
- [x] Fastify bootstrap on port 3001

## File Inventory (Phase 5)

### `server/db/`
| File | Status |
|------|--------|
| `schema.ts` | ✅ 8 tables |
| `client.ts` | ✅ Neon serverless |
| `queries.ts` | ✅ `getOrgGraph` |
| `seed.ts` | ✅ demo org/projects/tasks |

### `src/lib/api/`
| File | Status |
|------|--------|
| `types.ts` | ✅ |
| `client.ts` | ✅ |
| `useOrgGraph.ts` | ✅ staleTime 30s |

### `src/lib/canvas/`
| File | Status |
|------|--------|
| `buildGraphFromApi.ts` | ✅ CPM + nodes/edges |

### `src/lib/firebase/`
| File | Status |
|------|--------|
| `config.ts` | ✅ optional init |
| `useCanvasEvents.ts` | ✅ realtime task status |

## Dev Commands

```bash
# 1. Copy env templates and fill Neon URL
cp .env.server.example .env.server   # set DATABASE_URL?sslmode=require
cp .env.local.example .env.local     # set NEXT_PUBLIC_ORG_ID after seed

pnpm db:push
pnpm db:seed
pnpm dev:all

curl http://localhost:3001/health
curl http://localhost:3001/api/graph/YOUR_ORG_ID

pnpm diagnose   # needs .env.server + dev:server for API check
pnpm build
pnpm typecheck
pnpm typecheck:server
```

## Known Issues

1. **`.env.server` not present in repo** — Neon URL must be added locally before `db:push` / `db:seed` / `diagnose`.
2. Without `NEXT_PUBLIC_ORG_ID`, canvas shows "Missing org configuration" overlay.
3. Firebase realtime is no-op until `NEXT_PUBLIC_FIREBASE_*` vars are set.
4. `src/lib/seed/mockData.ts` retained for reference; canvas no longer hydrates from it on mount.

## Next Session (Phase 6)

**Recommended:** better-auth JWT, task create/edit, canvas position persistence API, collaborative presence cursors.
