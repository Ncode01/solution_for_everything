# [BUG-013] buildGraphFromApi always replaces entire graph

**Severity:** HIGH  
**Category:** Canvas  
**Status:** FIXED (Phase 11B — mergeGraphNodes in useOrgGraph)  
**PRD Reference:** Section 5.2

## Symptom

Any graph refresh loses: user-dragged positions (until BUG-010 fixed), `expandedProjects` phase nodes, cascade highlights, local `hidden` flags from semantic zoom mid-transition.

## Root Cause

`useOrgGraph` calls `setNodes(nodes)` with a **new array** from `buildGraphFromApi`, not `setNodes(prev => merge(prev, nodes))`.

`buildGraphFromApi` always sets `onToggleExpand: () => {}` on project nodes (line 175) — overwritten later by FlowCanvas effect, but full replace still drops ephemeral state.

## Evidence

- `src/lib/api/useOrgGraph.ts` lines 43–45
- `src/lib/canvas/buildGraphFromApi.ts` lines 234–237

## Fix

Implement `mergeGraphNodes(prev, next)`:

- Match by `node.id`
- Preserve `position` if user moved node since load (dirty flag or compare timestamps)
- Preserve `hidden`, `data.isExpanded` where appropriate
- Only add/remove nodes when task list changes

## Impact

Core stability; pairs with BUG-001.

## Effort Estimate

**M** (2–4h)
