# [GAP-005] Viewport persistence — partial implementation

**Severity:** VISION GAP  
**Category:** Canvas  
**Status:** PARTIAL  
**PRD Reference:** Section 5.2

## Symptom

May work for signed-in user; unverified in live browser audit.

## Root Cause

`useViewportPersistence.ts` exists: loads/saves viewport via `apiClient.getViewport` / `saveViewport` with 800ms debounce. Requires auth session + `graphReady`.

Potential issues:

- `fitView` may run before restore completes
- Viewport save on every pan fires debounced PUT (OK)
- Not wired when `activeView !== "canvas"`

## Fix

Verify on production; ensure `skipInitialFitView` set before first paint; test second session.

## Effort Estimate

**XS** verify + **S** if bugs found
