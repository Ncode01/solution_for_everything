# Module: Approvals

## Purpose
Track sign-off for posters, captions, agendas, sponsor proposals, budgets, and public announcements.

## Screens
- `/approvals` — list + filters
- Project Detail → Approvals tab (project-scoped)

## Data Used
- `approvals` collection; optional `projectId` and `relatedType`/`relatedId` link.

## Main Actions
- Filter by status and project
- Create / edit an approval request
- **Update status** inline: Draft → Submitted → Changes Requested → Approved / Rejected
- Add comments; show submitted date and approver

## Dashboard / Attention
- Pending (Submitted / Changes Requested) approvals appear in the Attention Center.

## Acceptance Criteria
- [x] Create/edit approval requests
- [x] Status can be changed
- [x] Pending approvals appear on dashboard
- [x] Project detail shows project approvals

## Linked Files
- `src/features/approvals/ApprovalsPage.tsx`
- `src/features/approvals/ApprovalForm.tsx`
