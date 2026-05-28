# [BUG-021] Task detail panel has no Comments / Subtasks tabs

**Severity:** MEDIUM  
**Category:** Canvas / Panels  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.5

## Symptom

Right panel shows single Details-style view only. No tab UI for Comments or Subtasks.

## Root Cause

`TaskDetailPanel.tsx` is a single scrollable form/view. Grep for `Comments`, `Subtasks`, `Tab` in `src/components/panels/` — no matches.

`RightPanel.tsx` only mounts `TaskDetailPanel` — no tab shell.

## Evidence

- PRD 5.5: "Tabs: Details | Comments | Subtasks"
- File: `src/components/panels/TaskDetailPanel.tsx` — no tab state

## Fix

Add tab header component; wire Comments to API when backend exists; Subtasks as child tasks or checklist (schema TBD).

## Impact

C-15, C-16 NOT_IMPLEMENTED; panel feels incomplete.

## Effort Estimate

**L** (4–8h) with backend
