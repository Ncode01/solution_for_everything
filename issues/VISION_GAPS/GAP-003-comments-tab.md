# [GAP-003] Comments tab / API not implemented

**Severity:** VISION GAP  
**Category:** Panels / API  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.5

## Symptom

No comments UI or persistence.

## Root Cause

No `comments` table usage in server routes; no Comments component in panels.

## Fix

Schema + `GET/POST /api/tasks/:id/comments` + tab UI in task panel.

## Effort Estimate

**XL** (>8h)
