# [GAP-004] Subtasks tab not implemented

**Severity:** VISION GAP  
**Category:** Panels / API  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.5

## Symptom

No subtask hierarchy in panel.

## Root Cause

Tasks are flat in schema; no `parentTaskId` or subtasks route found in frontend.

## Fix

Add `parent_task_id` optional FK, nested list in Subtasks tab, canvas optional child nodes.

## Effort Estimate

**L** (4–8h)
