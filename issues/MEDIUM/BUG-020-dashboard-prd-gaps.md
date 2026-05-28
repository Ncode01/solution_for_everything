# [BUG-020] Dashboard missing PRD KPI row, velocity chart, milestones

**Severity:** MEDIUM  
**Category:** Dashboard  
**Status:** CONFIRMED  
**PRD Reference:** Section 5.8

## Symptom

Dashboard loads but does not match PRD layout: no 4 KPI cards, no velocity chart, no milestone strip.

## Root Cause

`DashboardView.tsx` renders:

- 3× `ProjectHealthCard` (one per project, not 4 KPI metrics)
- `WorkloadChart`, `CriticalPathPanel`, `BlockedTasksPanel`

No components for velocity or milestones; grep shows no `Velocity` in `src/components/dashboard/`.

## Evidence

- File: `src/components/views/DashboardView.tsx` lines 127–140
- PRD 5.8: "4 KPI cards, velocity chart, project progress, team workload, milestone strip"

## Fix

Add KPI row (org-level metrics), `VelocityChart` (Recharts), `MilestoneStrip` per PRD; keep charts dashboard-only.

## Impact

D-02, D-05 partial; PRD 5.8 ~50% implemented.

## Effort Estimate

**L** (4–8h)
