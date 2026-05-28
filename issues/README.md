# FlowCanvas — Issue Tracker

Production issues found during Phase 11A audit (v1.0.0, commit `8d68792`).

## Severity Definitions

| Severity | Meaning |
|----------|---------|
| CRITICAL | App unusable or major feature completely broken |
| HIGH | Feature broken; workaround exists but painful |
| MEDIUM | Feature partially working, degraded UX |
| LOW | Polish, edge case, minor UX friction |
| VISION GAP | PRD feature not yet implemented |

## Issue Index

| ID | Title | Severity | Folder |
|----|-------|----------|--------|
| BUG-001 | Canvas flicker / graph reset loop | CRITICAL | [CRITICAL/BUG-001-canvas-reload-loop.md](CRITICAL/BUG-001-canvas-reload-loop.md) |
| BUG-002 | Project expand uses mock data, not API | CRITICAL | [CRITICAL/BUG-002-project-expand-mock-data.md](CRITICAL/BUG-002-project-expand-mock-data.md) |
| BUG-010 | Node drag positions not saved to API | HIGH | [HIGH/BUG-010-node-position-not-persisted.md](HIGH/BUG-010-node-position-not-persisted.md) |
| BUG-011 | Duplicate `org-graph` TanStack Query subscribers | HIGH | [HIGH/BUG-011-duplicate-org-graph-queries.md](HIGH/BUG-011-duplicate-org-graph-queries.md) |
| BUG-012 | Firebase events trigger full graph rebuild | HIGH | [HIGH/BUG-012-firebase-invalidates-full-graph.md](HIGH/BUG-012-firebase-invalidates-full-graph.md) |
| BUG-013 | `buildGraphFromApi` replaces entire node array | HIGH | [HIGH/BUG-013-build-graph-full-replace.md](HIGH/BUG-013-build-graph-full-replace.md) |
| BUG-020 | Dashboard missing PRD KPI / velocity / milestones | MEDIUM | [MEDIUM/BUG-020-dashboard-prd-gaps.md](MEDIUM/BUG-020-dashboard-prd-gaps.md) |
| BUG-021 | Task panel has no Comments / Subtasks tabs | MEDIUM | [MEDIUM/BUG-021-task-panel-tabs-missing.md](MEDIUM/BUG-021-task-panel-tabs-missing.md) |
| BUG-030 | Semantic zoom rewrites all nodes on level change | LOW | [LOW/BUG-030-semantic-zoom-node-rewrite.md](LOW/BUG-030-semantic-zoom-node-rewrite.md) |
| GAP-001 | MilestoneNode not implemented | VISION | [VISION_GAPS/GAP-001-milestone-node.md](VISION_GAPS/GAP-001-milestone-node.md) |
| GAP-002 | E-key dependency connect mode | VISION | [VISION_GAPS/GAP-002-edge-connect-mode.md](VISION_GAPS/GAP-002-edge-connect-mode.md) |
| GAP-003 | Comments tab / API | VISION | [VISION_GAPS/GAP-003-comments-tab.md](VISION_GAPS/GAP-003-comments-tab.md) |
| GAP-004 | Subtasks tab / API | VISION | [VISION_GAPS/GAP-004-subtasks-tab.md](VISION_GAPS/GAP-004-subtasks-tab.md) |
| GAP-005 | Viewport persistence | VISION | [VISION_GAPS/GAP-005-viewport-persistence.md](VISION_GAPS/GAP-005-viewport-persistence.md) |
| GAP-006 | Yjs CRDT canvas sync (PRD) | VISION | [VISION_GAPS/GAP-006-yjs-crdt.md](VISION_GAPS/GAP-006-yjs-crdt.md) |
| GAP-007 | Dependency type FS/FF/SS UI | VISION | [VISION_GAPS/GAP-007-dependency-types-ui.md](VISION_GAPS/GAP-007-dependency-types-ui.md) |

## Quick Links

- [AUDIT_REPORT.md](AUDIT_REPORT.md) — scores, PRD alignment, fix order
- [CRITICAL/](CRITICAL/) — fix first (Phase 11B)
- [VISION_GAPS/](VISION_GAPS/) — backlog (Phase 11D+)
