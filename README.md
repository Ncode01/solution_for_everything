# FlowCanvas

> Org-wide spatial task management. See everything. Know what matters.

An infinite canvas (like Figma) where every project, phase, task, and person
in your organization exists as a node in a live, computed dependency graph.

## Status: Phase 1 — UI Foundation (In Progress)

Running Next.js app with App Shell + ReactFlow canvas. See [docs/STATUS.md](docs/STATUS.md) for live progress.

```bash
pnpm install
pnpm dev    # http://localhost:3000
pnpm build
```

**Done:** App Shell, ReactFlow, Zustand stores, TypeScript types, Tailwind tokens  
**Pending:** Fastify server, Drizzle/PostgreSQL, auth, Stitch HTML in `/stitch-reference/`

## Quick Start (after Phase 1 init)

```bash
# Install dependencies
pnpm install

# Start dev environment (Next.js + Fastify + PostgreSQL)
pnpm dev

# Frontend only: localhost:3000
# Backend only: localhost:3001
```

## Environment setup (required after every db:seed)

1. Copy the template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Set required variables in `.env.local`:

   ```env
   NEXT_PUBLIC_ORG_ID=<uuid>        # printed by `pnpm db:seed` as "ORG_ID=..."
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. Run seed (creates org + test data):

   ```bash
   pnpm db:seed
   ```

   The last lines of output will be:

   ```
   ORG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Add to .env.local: NEXT_PUBLIC_ORG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

   Copy that UUID into `NEXT_PUBLIC_ORG_ID`.

4. Start both servers:

   ```bash
   pnpm dev          # Next.js on :3000
   pnpm server:dev   # Fastify on :3001
   ```

⚠️ If the topbar shows **Org not found**: the DB was re-seeded and `.env.local` has a stale `ORG_ID`. Re-run `pnpm db:seed` and update `.env.local`.

## Architecture

- **Frontend**: Next.js 15 (App Router) + ReactFlow v12 + Tailwind v4
- **Canvas**: @xyflow/react v12 — the entire app is built around this
- **Real-time**: Yjs CRDT + y-websocket for collaborative canvas sync
- **Backend**: Fastify v5 + Drizzle ORM + PostgreSQL 16
- **Intelligence**: Custom CPM (Critical Path Method) algorithm

## Docs

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Full product requirements |
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [Design System](docs/DESIGN_SYSTEM.md) | Colors, typography, components |
| [Screens](docs/SCREENS.md) | Stitch screen references + component mapping |
| [CPM Engine](docs/CPM_ENGINE.md) | Critical path algorithm |
| [Data Models](docs/DATA_MODELS.md) | Database schema |
| [API Contracts](docs/API_CONTRACTS.md) | REST + WebSocket events |
| [Roadmap](docs/ROADMAP.md) | Development phases |

## Cursor Rules

AI assistants read these before every edit:

- `.cursor/rules/architecture.mdc` — stack, folder structure, imports
- `.cursor/rules/design-system.mdc` — tokens, banned Stitch patterns
- `.cursor/rules/canvas-engine.mdc` — ReactFlow performance + semantic zoom
- `.cursor/rules/backend.mdc` — Fastify, DB, WS events
- `.cursor/rules/no-go.mdc` — hard bans (side borders, blur on nodes, etc.)

## Stitch Reference

Original UI designs in Google Stitch:

- **Project:** FlowCanvas Spatial Task Engine
- **Project ID:** `12965505653231340695`
- **HTML exports:** `/stitch-reference/` — component extraction only

The **code** source of truth is `.cursor/rules/design-system.mdc` and `tailwind.config.ts`.

### Screen audit highlights (fix in implementation)

| Issue | Fix |
|-------|-----|
| `border-r-2 border-primary` on nav | `bg-primary/10` + left pill |
| `backdrop-filter` on canvas nodes | Remove — kills FPS at scale |
| Material Symbols icons | Lucide React only |
| Z2 Build Sprint sidebar | Use S1 App Shell sidebar |
