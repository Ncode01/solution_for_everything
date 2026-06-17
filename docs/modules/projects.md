# Module: Projects

## Overview

Projects are the primary unit of work in RCCS Command Center. Each project maps to an RCCS event, product, or initiative (e.g. BTUI, SparkIT, Tesseract).

## Project Detail Workspace (Phase Three)

### Tabs

| Tab | Contents |
|-----|---------|
| Overview | Meta, Command Summary, Project Roadmap (phases), Important Links & Documents, Generate Report |
| Milestones | Key deliverables table with status controls |
| Tasks | Task list with status/priority inline controls |
| PR Plan | PR items with approval/publishing controls; PR file links shown below |
| Meetings | Project meetings, decisions, action items |
| Money | Budget summary cards, Money Health, Sponsor Pipeline, Income & Expenses, Deliverables, Finance Documents |
| Approvals | Approval requests for this project |

### Removed tabs (Phase Three)

- **Phases** tab removed — phases now shown as a compact "Project Roadmap" section in Overview with inline status editing.
- **Reports** tab removed — report generation is a quick action in Overview and available on the global Reports page.
- **Files** tab removed — file links shown contextually: all links in Overview, finance files in Money, PR files in PR Plan.
- **Sponsors** tab removed — sponsors merged into the Money tab as Sponsorship Pipeline.

All data is preserved; only the tab navigation is simplified.

## Overview Tab Details

- **Command Summary**: 6 metric tiles (overdue tasks, PR awaiting approval, pending approvals, open action items, confirmed sponsorship, budget surplus). Each tile navigates to the relevant tab.
- **Project Roadmap**: All phases shown with name, status badge, owner, date range, and progress bar. Inline status dropdown. Edit/Delete phase buttons. Add Phase button.
- **Important Links & Documents**: All file links for this project, grouped/displayed with category badges and status. Edit/Delete/Open actions. "Add Link" button.
- **Generate Report**: Quick action card generates a full project report and saves it to the global Reports page.

## Money Tab Details

See `docs/modules/finance.md` for the full Money tab specification.

## Health Score

| Label | Score | Meaning |
|-------|-------|---------|
| Healthy | ≥75 | No significant issues |
| Needs Attention | ≥45 | Some overdue tasks or pending approvals |
| At Risk | <45 | Multiple overdue tasks or approvals |

Score deductions: -12 per overdue task, -8 per pending approval, -4 per PR in review, -10 if progress <25% and project not complete.
