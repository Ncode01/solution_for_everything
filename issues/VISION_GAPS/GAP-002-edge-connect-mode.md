# [GAP-002] E-key dependency connect mode not implemented

**Severity:** VISION GAP  
**Category:** Canvas  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.4

## Symptom

Users cannot draw dependency edges from canvas with `E` key.

## Root Cause

Grep for `connectMode`, `EdgeMode`, `'E'` key handler in `src/lib/commands/` — no connect-mode implementation. Dependencies only via `DependencyEditSection` in task panel.

## Fix

Add connect mode to command registry: click source task → click target → `POST` dependency API; cycle check from CPM lib.

## Effort Estimate

**L** (4–8h)
