# Phase One Local Data Schema

Since Phase One uses localStorage, there is no real database. This documents the TypeScript data models that will later become database tables.

## User

```typescript
{
  id: string           // unique ID
  username: string     // login username
  displayName: string  // shown in UI
  role: 'Super Admin' | 'Executive Admin' | 'Member'
}
```

## Project

```typescript
{
  id: string
  name: string
  year: number
  type: ProjectType      // see types
  status: ProjectStatus  // Idea | Planning | Active | ...
  priority: ProjectPriority // Urgent | High | Medium | Low
  description: string
  owner: string
  startDate: string      // ISO date string
  endDate: string
  finalEventDate?: string
  progress: number       // 0-100
  phases: Phase[]
  milestones: Milestone[]
  tasks: Task[]
  prItems: PRItem[]
}
```

## Phase

```typescript
{
  id: string
  projectId: string
  name: string
  description: string
  startDate: string
  endDate: string
  owner: string
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed'
  progress: number
}
```

## Milestone

```typescript
{
  id: string
  projectId: string
  phaseId?: string
  name: string
  dueDate: string
  owner: string
  status: MilestoneStatus
  description: string
}
```

## Task

```typescript
{
  id: string
  projectId: string
  phaseId?: string
  milestoneId?: string
  title: string
  description: string
  assignee: string
  reviewer?: string
  dueDate: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  status: TaskStatus
  createdAt: string
}
```

## PRItem

```typescript
{
  id: string
  projectId: string
  title: string
  campaign: string
  platform: PRPlatform
  publishDate: string
  publishTime: string
  designer: string
  captionWriter: string
  reviewer: string
  approvalStatus: PRApprovalStatus
  publishingStatus: PRPublishingStatus
  caption: string
  designLink?: string
  notes?: string
}
```

## Phase Two Models (top-level collections)

These are stored as separate localStorage arrays and reference projects/members by id. See `src/types/index.ts` for the source of truth.

### Member
```typescript
{ id, name, displayName, role, committee, gradeOrClass,
  email?, phone?, skills: string[],
  availabilityStatus: 'Available'|'Busy'|'Away'|'Unavailable',
  workloadLevel: 'Light'|'Normal'|'Heavy'|'Overloaded',
  activeProjectIds: string[], notes? }
// committee: Executive | PR & Media | Development | Sponsorship | Finance |
//            Logistics | Events | Editorial | Education | General
```

### Meeting
```typescript
{ id, projectId?, title, type, date, time, location?,
  attendees: string[], agenda, notes,
  decisions: MeetingDecision[], actionItems: MeetingActionItem[],
  nextMeetingDate?, createdAt }
// type: Executive | Project | PR | Sponsorship | Logistics | Teacher Approval | Post-Project Review
MeetingDecision   { id, decision, owner?, date }
MeetingActionItem { id, title, owner, dueDate, status: Open|In Progress|Done|Cancelled, linkedTaskId? }
```

### Sponsor
```typescript
{ id, projectId, name, contactPerson, contactNumber?, email?,
  packageName, amount, stage, assignedMember,
  lastContactedDate?, nextFollowUpDate?, proposalLink?, agreementLink?,
  paymentStatus, deliverables: SponsorDeliverable[], notes? }
// stage: Lead | Contacted | Interested | Proposal Sent | Meeting Scheduled |
//        Negotiating | Confirmed | Rejected | Completed
// paymentStatus: Not Requested | Pending | Partially Paid | Paid | Overdue
SponsorDeliverable { id, title, dueDate?, status: Not Started|In Progress|Delivered|Cancelled, notes? }
```

### Budget & Transaction
```typescript
Budget      { id, projectId, expectedIncome, expectedExpense, confirmedIncome, confirmedExpense, notes? }
Transaction { id, projectId, type: Income|Expense, category, amount, date,
              paidBy?, approvedBy?, receiptLink?, notes? }
// category: Venue | Audio/Visual | Lighting | Decorations | Certificates | Medals |
//           Trophies | Refreshments | Transport | Printing | PR | Web/IT |
//           Equipment | Sponsorship | Miscellaneous
```

### ApprovalRequest
```typescript
{ id, projectId?, relatedType, relatedId?, title, description,
  requestedBy, approver, status, submittedDate, decisionDate?, comments? }
// relatedType: PR Item | Budget | Sponsor | Task | File | General
// status: Draft | Submitted | Changes Requested | Approved | Rejected
```

### FileLink
```typescript
{ id, projectId, title, category, url, owner, status, notes?, createdAt }
// category: Project Proposal | Budget | PR | Sponsorship | Meeting Notes | Invitations |
//           Certificates | Designs | Videos | Event Agenda | Final Report | Receipts | Other
// status: Draft | Final | Approved | Archived
```

### Report
```typescript
{ id, projectId, title, type: 'Project Summary'|'Post-Event Review'|'Handover',
  summary, generatedDate, sections, notes? }
```

## Migration Note

When Phase Three begins, each type becomes a Supabase/PostgreSQL table. Nested Phase One arrays (phases, milestones, tasks, prItems inside Project) become separate tables with `project_id` foreign keys. The Phase Two collections are already flat and map cleanly to tables.
