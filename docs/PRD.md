# FlowCanvas — Product Requirements Document

**Version:** 1.0 (Documentation scaffold)  
**Codename:** FlowCanvas Spatial Task Engine  
**Stitch Project ID:** `12965505653231340695`

---

## 1. Vision

FlowCanvas is the **command centre for Royal College Computer Society (RCCS)** — an org-wide spatial task system for managing a **portfolio of seven structurally different 2026 projects** (events, products, publications, collaborations) on one canvas. The infinite canvas is the product; **CPM**, **health scores**, **milestones**, and **cross-project links** surface what actually matters across BTUI, SparkIT, PROTOX, and the rest.

> See everything. Know what matters.

---

## 2. Problem Statement

Traditional task tools (Jira, Asana, Linear) hide cross-project dependencies and workload collisions behind nested pages. Engineering leads cannot answer:
- What blocks the hackathon launch?
- If this person is out, what cascades?
- Which 3 tasks, if delayed, slip the org deadline?

FlowCanvas answers these **spatially** — on one canvas with semantic zoom from org overview to task detail.

---

## 3. Target Users

FlowCanvas is built for **student-led technical societies** running multi-phase initiatives. The first production org is the **Royal College Computer Society (RCCS)**; **SparkIT'26** is its flagship year-long project (Flash → Fusion → Family).

| Persona | Primary need |
|---------|--------------|
| **Chairman / Secretary (Officer view)** | All 7 projects at Z0, health rings, cross-project edges, workload layer |
| **Treasurer / finance** | Budget burn per project (`budget_entries`), health budget penalty |
| **Phase Lead** (e.g. SparkIT Flash) | Phase tasks, dependencies, milestones for their project |
| **Committee Member** | Assigned tasks, status updates, workload visibility |
| **Teacher-in-Charge** | Read-only oversight; `org_roles.is_teacher_in_charge` |

Canvas-first principles unchanged: officers plan spatially at org zoom; members execute from the same graph.

### Project Type Intelligence (Phase 12)

FlowCanvas adapts cluster chrome by `project_type`:

- **Type badge** — Event, Product, Education, etc. on each `ProjectClusterNode`
- **Health ring** — 0–100 score from tasks, budget burn, blocked critical work
- **Partner chips** — Collaborative projects (`is_collaborative`) show `project_orgs`
- **Milestone strip** — Next hard date on the cluster card
- **MilestoneNode** — Diamond anchors on canvas near each project
- **CrossProjectEdge** — Dashed inter-project links at Z0 only (e.g. Syntax launches at BTUI)

---

## 4. Core Principles

1. **Canvas-first** — No action requires leaving the canvas except Dashboard/Gantt routes
2. **Computed truth** — CPM runs on every meaningful mutation; UI reflects float and critical path
3. **Semantic zoom** — Detail level follows zoom, not separate pages
4. **Performance budget** — 100+ nodes at 60fps; no blur on nodes; memoized ReactFlow types
5. **Dark-only** — Single theme; tokens from Stitch audit

---

## 5. Feature Requirements

### 5.1 App Shell (P0)
- Fixed layout: 48px top bar, 260px left sidebar, flex canvas, 360px optional right panel
- Top tabs: Canvas | Dashboard | Gantt (Gantt = Phase 5)
- Global ⌘K command palette
- Left nav: active state via `bg-primary/10` + left pill — **not** right border accent

### 5.2 Infinite Canvas (P0)
- ReactFlow v12 with dot-grid background (`#0E0D0C`)
- Pan, zoom, minimap
- Semantic zoom levels Z0–Z3 (see `docs/SCREENS.md`)
- Node types: ProjectCluster, PhaseCluster, TaskCard, Milestone, PersonAvatar

### 5.3 Task Management (P0)
- Create task inline on canvas (`T` key)
- Task card: title, status dot, assignee avatars, effort (mono label), due date
- Status: not_started, in_progress, blocked, in_review, done
- Status indication: glow / top border — **never** colored side borders

### 5.4 Dependencies (P0)
- Draw dependency edges (`E` connect mode)
- Types: FS (default), FF, SS
- Visual: bezier edges; animated when upstream in_progress
- Blocked edges: amber dashed
- Cycle prevention with inline error

### 5.5 Task Detail Panel (P0)
- 360px right panel on task click
- Tabs: Details | Comments | Subtasks
- Meta row: ID, effort, slack, due date
- Dependency chips (upstream/downstream)
- "View Full Blocking Chain" → S7 overlay

### 5.6 Critical Path & Blocking (P1)
- Client + server CPM (see `docs/CPM_ENGINE.md`)
- Gold `CriticalPathEdge` on critical path layer
- `SlackTimeBadge` when float &gt; 0
- Blocking chain cascade view with impact panel

### 5.7 Workload Layer (P1)
- Toggle dims tasks, shows person cards with SVG load rings
- Thresholds: green &lt;60%, amber 60–80%, red &gt;80%

### 5.8 Dashboard (P1)
- Separate `/dashboard` route
- 4 KPI cards, velocity chart, project progress, team workload, milestone strip
- Recharts only — not on canvas

### 5.9 Collaboration (P2)
- Yjs CRDT for node positions
- Live cursors via WebSocket presence
- Real-time task updates broadcast per org

### 5.10 Command Palette (P2)
- Search tasks, projects, people
- Fly-to viewport on selection
- Grouped results with keyboard navigation

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Canvas FPS | ≥ 60 @ 100 nodes |
| CPM client | &lt; 10ms @ 200 tasks |
| CPM server | &lt; 50ms @ 500 tasks |
| WS latency | &lt; 100ms task update propagation |
| Auth | JWT via better-auth |
| Data | PostgreSQL 16, org-scoped multi-tenancy |

---

## 7. Out of Scope (v1)

- Light mode / theme toggle
- Mobile canvas editing
- Custom node shapes marketplace
- Third-party integrations (Slack, GitHub) — post-MVP
- Gantt as primary view (Phase 5 derived view only)

---

## 8. Success Metrics

- Time to identify critical path for a project: &lt; 5 seconds
- Zero `backdrop-filter` on canvas nodes in production
- 100% Lucide icons (zero Material Symbols)
- Sidebar consistency: single App Shell across all canvas routes

---

## 9. Design References

| Asset | Location |
|-------|----------|
| Stitch HTML (11 screens) | `/stitch-reference/` |
| Screen mapping | `docs/SCREENS.md` |
| Tokens & components | `docs/DESIGN_SYSTEM.md` |
| Cursor enforcement | `.cursor/rules/*.mdc` |

---

## 10. Open Questions (Track in issues)

- [ ] Effort unit: hours vs story points — org-level setting?
- [ ] FF/SS lag values in CPM v1 or v2?
- [ ] Read-only share links — auth model?
