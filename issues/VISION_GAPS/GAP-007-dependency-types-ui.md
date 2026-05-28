# [GAP-007] Dependency types FS/FF/SS — type only, no UI

**Severity:** VISION GAP  
**Category:** Dependencies  
**Status:** PARTIAL  
**PRD Reference:** Section 5.4

## Symptom

All edges behave as finish-to-start; no UI to pick FF/SS.

## Root Cause

`DependencyType = "FS" | "FF" | "SS"` in `src/types/index.ts` but `buildGraphFromApi` and server edges do not expose type selector in `DependencyEditSection`.

## Fix

Store `type` on dependency row; render edge labels; CPM may need type-aware logic.

## Effort Estimate

**M** (2–4h)
