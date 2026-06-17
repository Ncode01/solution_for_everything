# Module: Meetings

## Purpose
Turn meetings into action, not just notes. Record agenda, decisions, and action items with owners and due dates.

## Screens
- `/meetings` — list + filters + detail modal
- Project Detail → Meetings tab (project-scoped)

## Data Used
- `meetings` collection (each has `decisions[]` and `actionItems[]`); optional `projectId`.

## Main Actions
- List/filter meetings by type and project
- Create / edit a meeting (agenda, notes, attendees)
- Add/edit decisions and action items
- Toggle action item status; **convert an action item to a task**
- **Copy meeting summary** to clipboard
- See action items due soon / unresolved

## Dashboard / Attention
- Overdue and due-soon meeting action items appear in the Attention Center.

## Acceptance Criteria
- [x] Create/edit meetings; record decisions + action items
- [x] Action items appear on dashboard when overdue/due soon
- [x] Project detail shows project meetings
- [x] Convert action item → task

## Linked Files
- `src/features/meetings/MeetingsPage.tsx`
- `src/features/meetings/MeetingForm.tsx`
