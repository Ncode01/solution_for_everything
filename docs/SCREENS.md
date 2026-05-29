# FlowCanvas Screens Reference

All screens were designed in Google Stitch (Project ID: `12965505653231340695`).
HTML source files live in `/stitch-reference/` for component extraction.

**Rule:** When implementing UI, always wrap canvas views in **S1 App Shell**. Never copy alternate sidebars from individual screens.

---

## Screen Inventory

### S1 — App Shell (Base Layout)
| Field | Value |
|-------|-------|
| Stitch ID | `f3902dd11e7742608aa2ccb49e506928` |
| Status | ✅ Canonical shell — use for all canvas routes |

**Layout:** `TopBar(48px)` + `LeftSidebar(260px)` + `Canvas(flex-1)` + `RightPanel(360px, hidden default)`

**Components to build:**
- `AppShell` — root layout wrapper
- `TopBar` — tabs (Canvas \| Dashboard \| Gantt), ⌘K trigger, notifications, avatar
- `LeftSidebar` — project tree, layer toggles, nav pills (no `border-r-2` active state)
- `CanvasArea` — ReactFlow host + dot grid
- `RightPanel` — slot for task detail / cascade panels

---

### S2 — Design System Preview
| Field | Value |
|-------|-------|
| Stitch ID | `f9dd1b75fea74388b3d0dab298364ba3` |
| Status | ✅ Reference only |

Extract: color swatches, typography specimen, button variants. Not a routable screen.

---

### S3 — Org Overview (Semantic Zoom Z0)
| Field | Value |
|-------|-------|
| Stitch ID | `bbdb07f9dd094322ace6c866a5c88c72` |
| Zoom | `viewport.zoom < 0.3` |

**Renders:** All `ProjectClusterNode` clusters (RCCS: 7 projects), `MilestoneNode` diamonds, `CrossProjectEdge` (dashed). Task cards hidden until Z2.

**Layout (Z0):**

- Projects in a **3-column grid** with **900px × 1100px** spacing (origin 100, 100)
- Milestones **stacked vertically** to the right of their parent cluster (+520px X, +60px then +90px per milestone)
- **Person nodes hidden** by default; on **project expand** they appear in an **arc above the cluster header**, showing **only assignees for that project**, with faint dashed edges to the project

**Components:** `ProjectClusterNode`, `MilestoneNode`, `PersonAvatarNode`, `CrossProjectEdge`

---

### S4 — Annual Hackathon (Semantic Zoom Z1)
| Field | Value |
|-------|-------|
| Stitch ID | `e02fee94e21f4c87992c63c205a9536c` |
| Zoom | `0.3 ≤ zoom < 0.7` |

**Renders:** Expanded `ProjectClusterNode`, `PhaseClusterNode` children, `MilestoneNode`, phase completion rings, dependency arrows

**Components:** `PhaseClusterNode`, `MilestoneNode`, `PhaseCompletionRing`

---

### S5 — Build Sprint (Semantic Zoom Z2)
| Field | Value |
|-------|-------|
| Stitch ID | `6750383872354b3099646bf16118d7df` |
| Zoom | `zoom ≥ 0.7` (Z2); `zoom ≥ 1.5` (Z3 detail expansion) |

**Renders:** Full `TaskCardNode` grid, status glows, bezier `DependencyEdge`

**Components:** `TaskCardNode` (core interactive node)

⚠️ **LEFT SIDEBAR IN THIS SCREEN IS WRONG** — use S1 App Shell sidebar only. Task cards and edges from S5 are authoritative.

---

### S6 — Task Detail Panel (v1)
| Field | Value |
|-------|-------|
| Stitch ID | `43869487e31f4e17895bc3bc23013b7e` |
| Trigger | Click `TaskCardNode` |

**Panel:** 360px right slide-in. Tabs: Details \| Comments \| Subtasks

**Components:** `TaskDetailPanel`, `DependencyChip`, `SlackTimeBadge`

---

### S7 — Blocking Chain Cascade View
| Field | Value |
|-------|-------|
| Stitch ID | `d7a77f62f54b4a72afae4e8f46f0c280` |
| Trigger | "View Full Blocking Chain" in task panel |

**Canvas state:** Dim non-chain nodes (`opacity-10`), vertical cascade stack, gold dependency arrows, amber banner

**Panel:** `CascadeImpactPanel` — reassignment suggestions

**Components:** `BlockingChainOverlay`, `CascadeImpactPanel`

---

### S8 — Workload Heatmap Layer
| Field | Value |
|-------|-------|
| Stitch ID | `6bd837ddccd144f38d0917d7466ea2fb` |
| Trigger | Workload layer toggle in toolbar |

**Canvas state:** Task nodes @ 50% opacity; `PersonWorkloadCard` @ full opacity

**Components:** `PersonWorkloadCard`, `LoadRing`, `WorkloadLayerToggle`

---

### S9 — Dashboard View
| Field | Value |
|-------|-------|
| Stitch ID | `810111cb912f49e79633edffdff434d4` |
| Route | `/dashboard` (separate page, not canvas) |

**Components:** `KPICard` ×4, `VelocityLineChart`, `ProjectProgressBarChart`, `TeamWorkloadBarChart`, `MilestoneTimeline`

Uses Recharts — **never** embed in `src/components/canvas/`.

---

### S10 — Command Palette
| Field | Value |
|-------|-------|
| Stitch ID | `1d94aa9d22634a31be6b7a135b2d6f3d` |
| Trigger | ⌘K / Ctrl+K globally |

**Behavior:** Grouped results, keyboard hints, backdrop blur on **overlay only** (not canvas nodes), fly-to viewport on select

**Components:** `CommandPalette`, `CommandResult`, `CommandGroup`

---

### S11 — Task Detail Panel (v2 — Definitive)
| Field | Value |
|-------|-------|
| Stitch ID | `f98abd8088e946eaa4db7279798c580e` |
| Status | ✅ Prefer over S6 |

More complete: breadcrumb, meta row, refined tabs, dependency section. Use as **single source** for `TaskDetailPanel` implementation.

---

## Semantic Zoom Summary

| Level | Zoom range | Visible nodes |
|-------|------------|---------------|
| Z0 | &lt; 0.3 | `ProjectClusterNode`, cross-project edges |
| Z1 | 0.3 – 0.7 | + `PhaseClusterNode`, `MilestoneNode` |
| Z2 | 0.7 – 1.5 | + `TaskCardNode` |
| Z3 | ≥ 1.5 | Expanded `TaskCardNode` detail |

Implementation: `node.hidden` toggling via `useViewport()` — see `docs/ARCHITECTURE.md` and `.cursor/rules/canvas-engine.mdc`.

---

## Screen Audit vs. PRD

| Screen | PRD Alignment | Action |
|--------|---------------|--------|
| App Shell | ✅ Perfect | Ship as-is |
| Org Overview Z0 | ✅ Strong | — |
| Annual Hackathon Z1 | ✅ Good | — |
| Build Sprint Z2 | ⚠️ Partial | Fix sidebar → S1 |
| Task Detail Panel | ✅ Strong | Prefer S11 over S6 |
| Blocking Chain | ✅ Excellent | — |
| Workload Heatmap | ✅ Good | — |
| Dashboard | ✅ Good | — |
| Command Palette | ✅ Clean | Blur on overlay only |
| Design System | ✅ Reference | Lucide not Material Symbols |

---

## stitch-reference/ File Naming Convention

Place exported HTML as:
```
stitch-reference/
  S1-app-shell.html
  S2-design-system.html
  ...
  S11-task-detail-v2.html
```

Add Stitch screen ID in HTML comment at top of each file for traceability.

---

## Phase 12 — Canvas intelligence components

### MilestoneNode

| Aspect | Spec |
|--------|------|
| Shape | 48×48 CSS diamond (`rotate(45deg)`), label below (not rotated) |
| Color | Project accent (coral / violet / sky / mint / amber) |
| Border glow | Red ≤7d, amber ≤30d, green otherwise |
| Sub-label | `TODAY` / `In Xd` / `Xd ago` (red if overdue) |
| Hard deadline | Lucide padlock when `isHardDeadline` |
| Handles | Target left only |
| Node id | `milestone:{uuid}` |
| Visibility | Shown at Z0 with projects; hidden at Z2–Z3 |

### ProjectClusterNode enhancements

| Element | Behavior |
|---------|----------|
| Type badge | Top-left pill: icon + Event/Product/… label from `projectType` |
| Health ring | SVG ring colored green/amber/red; % completion inside; hover tooltip with score + penalties |
| Partner chips | Amber `🤝 {orgName}` when `isCollaborative`; max 2 + overflow |
| Milestone strip | Bottom strip: `📅 {title} — in {n}d`; red/amber by urgency |

### CrossProjectEdge

| Type | Color | Label |
|------|-------|-------|
| launches_at | violet | Launches at |
| talent_pipeline | emerald | Talent pipeline |
| venue_shared | blue | Shared venue |
| funds_from | amber | Funds from |
| collaboration | pink | Collaboration |

Visible **only at Z0**; dashed 1.5px stroke; mid-edge pill label; optional `note` on hover.

---

## Selection Behavior

| Action | Result |
|--------|--------|
| Click task card | `selectNode('task-{id}', 'task')` + `openTaskView()` → TaskDetailPanel (360px) |
| Click project cluster | `selectNode('project-{id}', 'project')` → camera pans via `fitView`, ProjectDetailPanel (380px) |
| Click person avatar | `selectNode('person-{id}', 'person')` → PersonDetailPanel (360px) |
| Click canvas pane | `selectNode(null, null)` → all panels close |
| Selected node | White outline ring on canvas node |

Expand toggle on project clusters does **not** trigger selection (button click is excluded).

---

## ProjectDetailPanel

**Trigger:** `selectedNodeType === 'project'`

**Width:** 380px, slide-in from right (`transition-transform duration-300`)

| Section | Editable | Notes |
|---------|----------|-------|
| Project identity | Name, color swatch, type pills, status, dates | Completion % read-only bar |
| Health overview | Read-only | Collapsible; score ring, grade pill, blocked/overdue stats |
| Partner organisations | Add/delete | Shown when `isCollaborative`; inline add form |
| Milestones | Add/delete | Row click → `focusCanvasNode('milestone-{id}')` |
| Budget | Add/delete entries | Income/expenditure summary bar |
| Danger zone | Archive | Collapsed by default; confirm before archive |

Mutations: `useProjectMutations.ts` (optimistic cache, no invalidation on metadata-only patches).

---

## PersonDetailPanel

**Trigger:** `selectedNodeType === 'person'`

| Section | Editable | Notes |
|---------|----------|-------|
| Member identity | Name, role | Email read-only; avatar initials |
| Org roles | Assign/remove | Rank badge, teacher 🍎 indicator |
| Assigned projects | — | Click row → selects project + focuses camera |
| Workload summary | Read-only | Status breakdown bars, load badge (light/medium/heavy/overloaded) |

Mutations: `useUpdateUserMutation`, `useCreateOrgRoleMutation`, `useDeleteOrgRoleMutation`.
