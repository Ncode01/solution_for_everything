# [GAP-006] Yjs CRDT canvas sync (PRD) vs Firebase events

**Severity:** VISION GAP  
**Category:** Collaboration  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.9

## Symptom

PRD specifies Yjs + WebSocket for positions; app uses Firebase Firestore events + presence only.

## Root Cause

Architecture rules mention Yjs in stack; implementation uses `useCanvasEvents` Firestore + `usePresence` — no Yjs provider in `src/`.

## Fix

Phase 12+ — add Yjs doc for node positions or document PRD deviation.

## Effort Estimate

**XL** (>8h)
