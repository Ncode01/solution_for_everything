# Module: Sponsorship

## Phase Three Status

**Sponsorship is now handled entirely within the Money workflow.**

- The standalone Sponsors page (`/sponsors`) has been removed from the sidebar.
- The `/sponsors` route redirects to `/budget`.
- All sponsor management is accessible from:
  1. **Project Detail → Money tab → Sponsorship Pipeline section** (per-project)
  2. **Global Money & Sponsors page (`/budget`) → Sponsors sub-tab** (cross-project)

## Sponsor data model

```
Sponsor {
  id, projectId, name, contactPerson, contactNumber?, email?,
  packageName, amount, stage, assignedMember,
  lastContactedDate?, nextFollowUpDate?,
  proposalLink?, agreementLink?,
  paymentStatus, deliverables[], notes?
}
```

Stages: Lead → Contacted → Interested → Proposal Sent → Meeting Scheduled → Negotiating → Confirmed → Rejected / Completed

Payment statuses: Not Requested · Pending · Partially Paid · Paid · Overdue

## Validation

- Package name empty → non-blocking warning shown in form
- Active stage with no follow-up date → non-blocking warning shown in form

## Calendar integration

Sponsor follow-up dates appear on the Calendar as orange "Follow-ups" items. Clicking navigates to `/budget`.

## Attention Center

Overdue/due-soon follow-ups and unpaid confirmed sponsors appear in the Attention Center on the Dashboard, both linking to `/budget`.

## Search

Searching for a sponsor name, package, or assigned member returns results with type "Sponsor" linking to `/budget`.
