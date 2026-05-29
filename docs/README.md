# FlowCanvas Documentation

FlowCanvas is an **org-wide spatial task management** web app: projects, phases, tasks, and people live on an infinite canvas (like Figma) with dependency edges, Gantt, and dashboard views. Data is stored in PostgreSQL; the canvas syncs via REST and optional Firebase realtime.

**Production pilot:** single-organization deployment on Vercel + Railway + Neon, with optional Firebase. See [STATUS.md](./STATUS.md) and [PRE_RELEASE.md](./PRE_RELEASE.md).

---

## What this app does

- Visualize your organization’s work on a **spatial canvas** (React Flow)
- **Create, edit, drag, and archive** tasks with optimistic updates
- See **dependencies**, **critical path**, and **workload** overlays
- Switch to **Gantt** (timeline) and **Dashboard** (KPIs) views
- **Invite** teammates and sign in with Better Auth

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind v4 |
| Canvas | `@xyflow/react` v12 |
| Client state | Zustand (`canvas`, `ui`) |
| Server state | TanStack Query v5 |
| API server | Fastify v5 on Railway |
| Database | PostgreSQL 16 + Drizzle ORM (Neon) |
| Auth | Better Auth (JWT session cookies) |
| Optional realtime | Firebase Firestore (presence + events) |
| Hosting | Vercel (app), Railway (API) |

---

## Who should read what

| Audience | Start here |
|----------|------------|
| **End users** | [USER_MANUAL.md](./USER_MANUAL.md) |
| **Engineers (new to repo)** | [ARCHITECTURE.md](./ARCHITECTURE.md) → [API.md](./API.md) |
| **Operators / DevOps** | [DEPLOY.md](./DEPLOY.md) → [ENV.md](./ENV.md) → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| **Release / QA** | [PRE_RELEASE.md](./PRE_RELEASE.md) → [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) |
| **Product / planning** | [PRD.md](./PRD.md), [ROADMAP.md](./ROADMAP.md) |

---

## Quick start

### Local development

```bash
pnpm install
cp .env.local.example .env.local      # fill DATABASE_URL, ORG_ID, secrets
cp .env.server.example .env.server
pnpm db:push && pnpm db:seed
pnpm auth:seed && pnpm auth:link-owner
pnpm dev                              # Next.js :3000 + API :3001
```

Details: [DEPLOY.md](./DEPLOY.md), [ENV.md](./ENV.md).

### Verify health

```bash
pnpm typecheck
pnpm typecheck:server
pnpm diagnose                         # start API for full pass
```

Production API: `PROD_API_URL=... NEXT_PUBLIC_ORG_ID=... pnpm diagnose:prod`

---

## Documentation map

### Primary (handoff)

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This entry point |
| [USER_MANUAL.md](./USER_MANUAL.md) | How to use the product (non-technical) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flows, diagnostics |
| [API.md](./API.md) | REST API contract (Fastify) |
| [ENV.md](./ENV.md) | All environment variables |
| [DEPLOY.md](./DEPLOY.md) | Vercel, Railway, Firebase setup |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Failure modes and debugging |
| [STATUS.md](./STATUS.md) | What is shipped vs deferred |
| [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) | Audit history and fixes |
| [PRE_RELEASE.md](./PRE_RELEASE.md) | Go/no-go checklist |

### Product & design reference

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Product requirements |
| [ROADMAP.md](./ROADMAP.md) | Phase plan |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI tokens and rules |
| [SCREENS.md](./SCREENS.md) | Screen → component mapping |
| [DATA_MODELS.md](./DATA_MODELS.md) | Database schema |
| [CPM_ENGINE.md](./CPM_ENGINE.md) | Critical path algorithm |

### Archived

| Location | Description |
|----------|-------------|
| [docs/.temp/](./.temp/README.md) | Superseded docs (e.g. old API_CONTRACTS) |
| [issues/](../issues/README.md) | Tracked bugs and vision gaps |

---

## Repository layout (30-second orientation)

```
src/           Next.js app (canvas, panels, views, lib, stores)
server/        Fastify API (separate process — never import from src/)
docs/          Documentation (start here)
scripts/       diagnose, auth:seed, link-owner
issues/        Bug and gap tracking
```

Root [README.md](../README.md) is a short project blurb; **this file is the documentation hub.**

---

## Production readiness (summary)

| Ready | Deferred / non-critical |
|-------|-------------------------|
| Canvas + API graph, drag persist | Yjs CRDT (GAP-006) |
| Auth without hard reload on 401 | Notifications backend |
| Dashboard / Gantt error + retry | Preview multi-origin CORS |
| Workload from live data | Configurable workload thresholds |
| Firebase optional | Canvas bookmarks |

Full checklist: [PRE_RELEASE.md](./PRE_RELEASE.md).
