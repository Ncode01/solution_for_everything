# [GAP-001] MilestoneNode not implemented

**Severity:** VISION GAP  
**Category:** Canvas  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.2

## Symptom

No milestone nodes on canvas at any zoom level.

## Root Cause

`nodeTypes` in `FlowCanvas.tsx` lists: `taskCard`, `projectCluster`, `phaseCluster`, `personAvatar` — no `milestone`.

`MilestoneNodeData` exists in `src/types/index.ts` but no component in `src/components/canvas/nodes/`.

## Fix

Add `MilestoneNode.tsx`, register in `nodeTypes`, include in `buildGraphFromApi` from API milestones table (schema may need extension).

## Effort Estimate

**M** (2–4h)
