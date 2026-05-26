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

**Renders:** 4× `ProjectClusterNode`, `PersonAvatarNode` overlays, `CrossProjectEdge` (dashed)

**Components:** `ProjectClusterNode`, `PersonAvatarNode`, `CrossProjectEdge`

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
