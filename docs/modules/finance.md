# Module: Finance (Money & Sponsors)

## Overview

As of Phase Three, Budget and Sponsors are unified as a single **Money** workflow. There are two entry points:

1. **Project Detail → Money tab** — per-project view
2. **Global `/budget` page** — cross-project Money & Sponsors hub (sidebar label: **Money**)

The old `/sponsors` route redirects to `/budget`.

## Project Detail — Money Tab

### Summary Cards (6)

1. Expected Income
2. Confirmed Income
3. Expected Expense
4. Recorded Expense
5. Surplus / Deficit
6. Sponsor Pipeline value

### Money Health Section

Shows a health label (Healthy / Needs Attention / At Risk) and four health metrics:

| Metric | Warning trigger |
|--------|----------------|
| Budget used % | Visual indicator |
| Missing receipts | > 0 turns amber |
| Overdue follow-ups | > 0 turns red |
| Overdue deliverables | > 0 turns amber |

Budget usage progress bar shown below metrics. "Edit Budget Plan" button.

### Sponsorship Pipeline Section

Lists all sponsors for this project with:
- Name, stage badge, payment status badge
- Package name · amount · assigned member
- Next follow-up date (red if overdue)
- Deliverable count
- Proposal/Agreement links
- Inline stage dropdown and payment status dropdown
- Edit / Delete buttons
- "Add Sponsor" button

### Income & Expenses Section

Transaction list with type filter (All / Income / Expense):
- Category · type color label
- Date · approved by · no-receipt warning
- Amount (green for income, red for expense)
- Receipt link
- Edit / Delete actions
- "Add Transaction" button

### Sponsor Deliverables Section

Only shown when deliverables exist. Lists all deliverables across all project sponsors:
- Title · sponsor name · due date
- Status badge
- Overdue indicator
- Edit button (opens sponsor edit modal)

### Finance Documents Section

File links filtered to categories: Budget, Sponsorship, Receipts, Final Report.
- Open / Edit / Delete actions
- "Add Document" button (opens file link form pre-set to Budget category)

## Global Money & Sponsors Page (`/budget`)

### Project selector
Dropdown to pick which project to view.

### Top summary row
Same 6 summary cards as the project Money tab.

### Warnings card
Amber warnings for: expense over budget, income below target, missing receipts, overdue sponsor follow-ups.

### Sub-tabs

| Tab | Contents |
|-----|---------|
| Overview | Budget Plan card, Recorded Transactions card (with usage bar), Sponsor Summary card |
| Transactions | Type filter + sortable transaction table with receipt indicator |
| Sponsors | Stage/payment filters + sponsor totals row + sponsor list with inline controls |

## Data Model

See `src/types/index.ts`:
- `Budget` — expectedIncome, expectedExpense, confirmedIncome, confirmedExpense
- `Transaction` — type, category, amount, date, receiptLink, approvedBy
- `Sponsor` — stage, paymentStatus, deliverables[], nextFollowUpDate, assignedMember
- `SponsorDeliverable` — title, dueDate, status

All collections are top-level in `AppData` and stored in separate localStorage keys.
