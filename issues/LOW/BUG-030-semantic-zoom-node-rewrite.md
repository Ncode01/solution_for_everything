# [BUG-030] Semantic zoom rewrites all nodes on level change

**Severity:** LOW  
**Category:** Canvas / Performance  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.2 — semantic zoom Z0–Z3

## Symptom

Brief flicker when crossing zoom thresholds (0.3, 0.7, 1.5); minor jank at scale.

## Root Cause

`useSemanticZoom.ts` calls `setNodes` mapping **every** node when `zoom` crosses a level boundary, toggling `hidden` and `data.isExpanded`.

Runs on every `activeLayer` change too (lines 75–82).

## Evidence

- File: `src/lib/canvas/useSemanticZoom.ts` lines 30–82

## Fix

- Toggle `hidden` via ReactFlow `node.hidden` without cloning all `data` objects where possible.
- Batch updates; skip if visibility unchanged per node.

## Impact

Minor UX; contributes to reload perception with BUG-001.

## Effort Estimate

**S** (1–2h)
