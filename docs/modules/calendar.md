# Module: Calendar

## Overview

The Calendar is a month-based agenda view showing all time-sensitive items across projects, meetings, and the sponsor pipeline.

## Item types

| Type | Color | Icon | Source |
|------|-------|------|--------|
| task | blue | ListTodo | Project tasks with dueDate |
| milestone | amber | Target | Project milestones with dueDate |
| pr | violet | Megaphone | PR items with publishDate |
| event | emerald | Flag | Project finalEventDate |
| meeting | cyan | CalendarCheck | Meetings with date |
| sponsor | orange | Handshake | Sponsor nextFollowUpDate (active stages) |

## Filters

- **Type buttons**: All · Tasks · Milestones · PR Posts · Meetings · Events · Follow-ups
- **Project dropdown**: All Projects or specific project

## Navigation

- Month prev/next chevron buttons in PageHeader
- Today / This week labels on date headers
- Past dates shown in muted red
- Today's date highlighted in blue

## Click behaviour

- Task → `/projects/:id`
- Milestone → `/projects/:id`
- PR Post → `/pr-planner`
- Event → `/projects/:id`
- Meeting → `/meetings`
- Sponsor follow-up → `/budget`

## Export Agenda

"Export Agenda" button copies the currently visible (filtered) calendar as plain text to the clipboard. Format:

```
RCCS Agenda — June 2026

Thursday 4 June
  [TASK] Design poster — BTUI (Kavesh · Urgent)
  [MEETING] Sponsorship debrief — BTUI (Sponsorship Meeting · 14:00)
```

## Known limitations

- No grid/month view (agenda only)
- No drag-and-drop
- No Google Calendar sync
