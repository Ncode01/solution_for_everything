# Module: Dashboard

## Overview

The Dashboard is the operations cockpit. It prioritises what needs doing now across all active projects.

## Sections

### Stats row (5 cards)
1. Active Projects → navigates to /projects
2. Overdue Tasks → navigates to /projects
3. Pending Approvals → navigates to /approvals
4. Confirmed Sponsors (Rs) → navigates to /budget
5. Sponsor Pipeline (Rs) → navigates to /budget

### Attention Center (left column, 2/3 width)

Groups of actionable items with colour-coded left borders (red = danger, amber = warning, blue = info):

| Group | Trigger |
|-------|---------|
| Overdue tasks | task.dueDate < today and status not Done/Approved |
| Tasks due today/tomorrow | dueDate within 2 days |
| PR needing approval | approvalStatus Internal Review or Teacher Review |
| PR scheduled soon | publishDate within 7 days |
| Sponsor follow-ups due | nextFollowUpDate overdue or within 3 days |
| Sponsor payments to chase | paymentStatus Overdue or Confirmed+unpaid |
| Expenses missing receipts | type=Expense and no receiptLink |
| Meeting action items due | actionItem.dueDate overdue or within 3 days |
| Approval requests pending | status=Submitted |

All items link to `/budget` for money/sponsor items (updated Phase Three).

### Project Health (right column, 1/3 width)

Cards for each active/planning project showing:
- Name, status badge, health label (Healthy / Needs Attention / At Risk)
- Progress bar
- Overdue count, pending approvals count, next deadline

Health labels: Healthy ≥75 · Needs Attention ≥45 · At Risk <45

### Money Snapshot (right column, below Project Health)

Cross-project finance overview:
- Expected income
- Confirmed income
- Expected expense
- Recorded expense
- Sponsor pipeline value
- Missing receipts count (amber warning if > 0)

"View all" link navigates to `/budget`.

### Quick Actions menu

New Project · New Task · New PR Item · New Meeting · New Sponsor · New Transaction · New Approval · Generate Report
