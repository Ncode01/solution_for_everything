# Module: PR Planner

## Purpose

The PR Planner is the central view for the RCCS media and PR team. It shows all upcoming and past PR posts across all projects and helps track design, caption, approval, and publishing status.

## Screen

- `/pr-planner` — global PR planner

## PR Item Fields

| Field | Description |
|-------|-------------|
| Title | Post title |
| Project | Linked RCCS project |
| Campaign | Campaign name |
| Platform | Instagram, Facebook, LinkedIn, etc. |
| Publish Date/Time | When to post |
| Designer | Who designs the post |
| Caption Writer | Who writes the caption |
| Reviewer | Who approves the post |
| Approval Status | Draft → Internal Review → Teacher Review → Approved |
| Publishing Status | Idea → Designing → Scheduled → Posted → Archived |
| Caption | Full post caption |
| Design Link | Canva/Figma link |
| Notes | Internal notes |

## Main Actions

- View all PR items across all projects, sorted by publish date
- Search by title or campaign
- Filter by project, platform, approval status, publishing status
- Create new PR item (select project first)
- Edit PR item
- Change approval/publishing status inline
- Delete PR item (with confirmation)

## Also Available In

Project Detail Page → PR Plan tab shows the same items filtered to that project.

## Acceptance Criteria

- [x] All seeded PR items appear in PR Planner
- [x] Filters work correctly
- [x] New PR item can be created from PR Planner page
- [x] Status updates persist after refresh
- [x] PR items appear in Calendar with publish dates

## Phase Two Updates

Now operational, not just a list:
- Sections: **Needs approval**, **Ready to post**, **This week**.
- **Project filter**; quick update of approval + publishing status.
- **Copy caption** button and open-design-link button.
- **Missing-field warnings** (no caption, no designer, no publish time).

## Linked Files

- `src/features/pr/PRPlannerPage.tsx`
- `src/features/pr/PRItemForm.tsx`
- `src/lib/stats.ts` (getPRThisWeek, getPendingApprovalPR)
