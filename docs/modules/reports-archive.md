# Module: Reports & Archive

## Overview

Reports are generated project summaries used for handover, post-event review, or team records.

## Access points (Phase Three)

1. **Project Detail → Overview tab** — "Generate Project Report" quick action card. Generates and saves immediately, then navigates to the global Reports page.
2. **Global Reports page (`/reports`)** — pick a project, generate, preview, copy, print, and save. Saved reports listed below.

The Reports tab was removed from Project Detail to keep the workspace lean.

## Report content

A generated report includes:

- Project Overview (status, owner, timeline, progress, description)
- Phases (list with status and progress)
- Milestones (with due dates and status)
- Tasks Summary (total, done, overdue list)
- PR Summary (total, awaiting approval list)
- Sponsors Summary (count, confirmed, pipeline, per-sponsor status)
- Budget Summary (expected vs recorded, surplus, usage %)
- Meetings Summary (count, decisions, open actions per meeting)
- Pending Issues (overdue tasks, PR, approvals, missing receipts)
- Recommendations (placeholder for manual notes)

## Actions on saved reports

- **View** — click to load into preview
- **Copy** — copies full text to clipboard
- **Print** — opens browser print dialog
- **Save** — saves preview as new record
- **Delete** — removes saved report with confirmation

## Data model

```
Report {
  id, projectId, title, type (Project Summary | Post-Event Review | Handover),
  summary, generatedDate, sections, notes?
}
```
