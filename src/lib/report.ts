import { AppData, Project } from '../types';
import { getBudgetSummary, getSponsorTotals } from './stats';
import { formatDate, formatCurrency, isOverdue, todayISO, formatDateShort } from './dateUtils';

export interface GeneratedReport {
  title: string;
  summary: string;
  sections: string;
}

export function generateProjectReport(data: AppData, project: Project): GeneratedReport {
  const lines: string[] = [];
  const add = (s = '') => lines.push(s);

  // Overview
  add('## Project Overview');
  add(`Name: ${project.name}`);
  add(`Type: ${project.type}`);
  add(`Status: ${project.status} · Priority: ${project.priority}`);
  add(`Owner: ${project.owner || '—'}`);
  add(`Timeline: ${formatDate(project.startDate)} → ${formatDate(project.endDate)}`);
  if (project.finalEventDate) add(`Final Event: ${formatDate(project.finalEventDate)}`);
  add(`Progress: ${project.progress}%`);
  if (project.description) add(`\n${project.description}`);

  // Phases
  add('\n## Phases');
  if (project.phases.length === 0) add('None.');
  project.phases.forEach((ph) => add(`- ${ph.name} — ${ph.status} (${ph.progress}%)`));

  // Milestones
  add('\n## Milestones');
  if (project.milestones.length === 0) add('None.');
  project.milestones.forEach((m) => add(`- ${m.name} — ${m.status} (due ${formatDate(m.dueDate)})`));

  // Tasks summary
  const done = project.tasks.filter((t) => t.status === 'Done' || t.status === 'Approved').length;
  const overdue = project.tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Approved');
  add('\n## Tasks Summary');
  add(`Total: ${project.tasks.length} · Done: ${done} · Overdue: ${overdue.length}`);
  if (overdue.length) {
    add('Overdue tasks:');
    overdue.forEach((t) => add(`- ${t.title} (${t.assignee || 'Unassigned'}, due ${formatDate(t.dueDate)})`));
  }

  // PR summary
  add('\n## PR Summary');
  add(`Total PR items: ${project.prItems.length}`);
  const pendingPR = project.prItems.filter((pr) => pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review');
  if (pendingPR.length) {
    add('Awaiting approval:');
    pendingPR.forEach((pr) => add(`- ${pr.title} (${pr.approvalStatus})`));
  }

  // Sponsors
  const sponsors = data.sponsors.filter((s) => s.projectId === project.id);
  const sponsorTotals = getSponsorTotals(sponsors);
  add('\n## Sponsors Summary');
  add(`Sponsors: ${sponsors.length} · Confirmed: ${formatCurrency(sponsorTotals.confirmed)} · Pipeline: ${formatCurrency(sponsorTotals.pipeline)}`);
  sponsors.forEach((s) => add(`- ${s.name} — ${s.stage} · ${formatCurrency(s.amount)} · ${s.paymentStatus}`));

  // Budget
  const budget = getBudgetSummary(data, project.id);
  add('\n## Budget Summary');
  add(`Expected Income: ${formatCurrency(budget.expectedIncome)} · Expected Expense: ${formatCurrency(budget.expectedExpense)}`);
  add(`Recorded Income: ${formatCurrency(budget.actualIncome)} · Recorded Expense: ${formatCurrency(budget.actualExpense)}`);
  add(`Surplus / Deficit: ${formatCurrency(budget.surplus)} · Usage: ${budget.usagePct}%`);

  // Meetings
  const meetings = data.meetings.filter((m) => m.projectId === project.id);
  add('\n## Meetings Summary');
  add(`Meetings recorded: ${meetings.length}`);
  meetings.forEach((m) => {
    const open = m.actionItems.filter((a) => a.status !== 'Done' && a.status !== 'Cancelled').length;
    add(`- ${m.title} (${formatDate(m.date)}) — ${m.decisions.length} decisions, ${open} open actions`);
  });

  // Pending issues
  add('\n## Pending Issues');
  const approvals = data.approvals.filter((a) => a.projectId === project.id && (a.status === 'Submitted' || a.status === 'Changes Requested'));
  if (overdue.length) add(`- ${overdue.length} overdue task(s)`);
  if (pendingPR.length) add(`- ${pendingPR.length} PR item(s) awaiting approval`);
  if (approvals.length) add(`- ${approvals.length} approval request(s) pending`);
  if (budget.missingReceipts) add(`- ${budget.missingReceipts} expense(s) missing receipts`);
  if (!overdue.length && !pendingPR.length && !approvals.length && !budget.missingReceipts) add('- None flagged.');

  // Recommendations placeholder
  add('\n## Recommendations');
  add('- (Add handover notes and recommendations here.)');

  const summary = `${project.name} — ${project.status}, ${project.progress}% complete. ${overdue.length} overdue task(s), ${pendingPR.length} PR awaiting approval. Confirmed sponsorship ${formatCurrency(sponsorTotals.confirmed)}.`;

  return {
    title: `${project.name} — Project Report (${formatDate(todayISO())})`,
    summary,
    sections: lines.join('\n'),
  };
}

/** Comprehensive handover report for future RCCS batches. */
export function generateHandoverReport(data: AppData, project: Project): GeneratedReport {
  const lines: string[] = [];
  const add = (s = '') => lines.push(s);
  const deliverables = (data.deliverables ?? []).filter((d) => d.projectId === project.id);
  const eventDayItems = (data.eventDayItems ?? []).filter((e) => e.projectId === project.id);
  const activity = (data.activityItems ?? []).filter((a) => a.projectId === project.id).slice(-20);
  const fileLinks = data.fileLinks.filter((f) => f.projectId === project.id);
  const approvals = data.approvals.filter((a) => a.projectId === project.id);
  const meetings = data.meetings.filter((m) => m.projectId === project.id);
  const sponsors = data.sponsors.filter((s) => s.projectId === project.id);
  const sponsorTotals = getSponsorTotals(sponsors);
  const budget = getBudgetSummary(data, project.id);
  const done = project.tasks.filter((t) => t.status === 'Done' || t.status === 'Approved').length;
  const overdue = project.tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Approved');

  add('# RCCS OS Handover Report');
  add(`Generated: ${formatDate(todayISO())}`);
  add('');

  add('## 1. Project Overview');
  add(`Name: ${project.name}`);
  add(`Type: ${project.type}`);
  add(`Status: ${project.status} · Year: ${project.year} · Priority: ${project.priority}`);
  add(`Owner: ${project.owner || '—'}`);
  add(`Timeline: ${formatDate(project.startDate)} → ${formatDate(project.endDate)}`);
  if (project.finalEventDate) add(`Final Event: ${formatDate(project.finalEventDate)}`);
  add(`Progress: ${project.progress}%`);
  if (project.description) add(`\n${project.description}`);

  add('\n## 2. Owners & Key People');
  add(`Project Head: ${project.owner || '—'}`);
  const assignees = [...new Set(project.tasks.map((t) => t.assignee).filter(Boolean))];
  if (assignees.length) add(`Task assignees: ${assignees.join(', ')}`);

  add('\n## 3. Timeline / Phases');
  if (project.phases.length === 0) add('None recorded.');
  project.phases.forEach((ph) => add(`- ${ph.name} — ${ph.status} (${ph.progress}%) · ${formatDateShort(ph.startDate)} → ${formatDateShort(ph.endDate)}`));

  add('\n## 4. Milestones');
  if (project.milestones.length === 0) add('None recorded.');
  project.milestones.forEach((m) => add(`- ${m.name} — ${m.status} (due ${formatDate(m.dueDate)})`));

  add('\n## 5. Deliverables');
  if (deliverables.length === 0) add('None recorded.');
  deliverables.forEach((d) => add(`- ${d.title} (${d.type}) — ${d.status}${d.dueDate ? ` · due ${formatDate(d.dueDate)}` : ''}`));

  add('\n## 6. Tasks Summary');
  add(`Total: ${project.tasks.length} · Done: ${done} · Overdue: ${overdue.length}`);
  if (overdue.length) overdue.forEach((t) => add(`- OVERDUE: ${t.title} (${t.assignee || 'Unassigned'})`));

  add('\n## 7. Launches / PR Summary');
  add(`Total launch items: ${project.prItems.length}`);
  project.prItems.forEach((pr) => add(`- ${pr.title} — ${pr.approvalStatus} / ${pr.publishingStatus} · ${pr.platform}`));

  add('\n## 8. Meetings & Decisions');
  add(`Meetings: ${meetings.length}`);
  meetings.forEach((m) => {
    add(`- ${m.title} (${formatDate(m.date)})`);
    m.decisions.forEach((d) => add(`  · Decision: ${d.decision}`));
  });

  add('\n## 9. Money Summary');
  add(`Expected Income: ${formatCurrency(budget.expectedIncome)} · Expense: ${formatCurrency(budget.expectedExpense)}`);
  add(`Recorded Income: ${formatCurrency(budget.actualIncome)} · Expense: ${formatCurrency(budget.actualExpense)}`);
  add(`Surplus: ${formatCurrency(budget.surplus)}`);

  add('\n## 10. Sponsors & Deliverables');
  add(`Sponsors: ${sponsors.length} · Confirmed: ${formatCurrency(sponsorTotals.confirmed)}`);
  sponsors.forEach((s) => add(`- ${s.name} — ${s.stage} · ${formatCurrency(s.amount)} · ${s.paymentStatus}`));

  add('\n## 11. Approvals Summary');
  approvals.forEach((a) => add(`- ${a.title} — ${a.status} (${a.relatedType})`));

  add('\n## 12. Event-Day Items');
  if (eventDayItems.length === 0) add('None recorded.');
  eventDayItems.forEach((e) => add(`- ${e.title} — ${e.status} (${e.category})${e.notes ? ` · ${e.notes}` : ''}`));

  add('\n## 13. Important File Links');
  if (fileLinks.length === 0) add('None recorded.');
  fileLinks.forEach((f) => add(`- ${f.title} (${f.category}): ${f.url}`));

  add('\n## 14. Recent Activity');
  if (activity.length === 0) add('No activity recorded.');
  activity.forEach((a) => add(`- ${a.summary} (${formatDate(a.createdAt.slice(0, 10))})`));

  add('\n## 15. Problems / Risks / Known Issues');
  const issues: string[] = [];
  if (overdue.length) issues.push(`${overdue.length} overdue task(s)`);
  const pendingPR = project.prItems.filter((pr) => pr.approvalStatus !== 'Approved' && pr.publishingStatus !== 'Posted');
  if (pendingPR.length) issues.push(`${pendingPR.length} launch item(s) not fully published`);
  if (budget.missingReceipts) issues.push(`${budget.missingReceipts} expense(s) missing receipts`);
  if (issues.length === 0) issues.push('None flagged at handover time.');
  issues.forEach((i) => add(`- ${i}`));

  add('\n## 16. Recommendations for Next Year');
  add('- (Add recommendations for the next RCCS batch here.)');
  add('- Review sponsor pipeline early.');
  add('- Archive all file links and confirm receipts are uploaded.');

  add('\n## 17. Final Handover Checklist');
  add('- [ ] All deliverables marked Completed or Archived');
  add('- [ ] Final report saved to Library');
  add('- [ ] Budget reconciled with treasurer');
  add('- [ ] Sponsor deliverables confirmed');
  add('- [ ] Event-day checklist completed');
  add('- [ ] Project status set to Completed or Archived');

  const summary = `${project.name} handover — ${project.status}, ${project.progress}% complete. ${deliverables.length} deliverables, ${eventDayItems.length} event-day items, ${formatCurrency(sponsorTotals.confirmed)} confirmed sponsorship.`;

  return {
    title: `${project.name} — Handover Report (${formatDate(todayISO())})`,
    summary,
    sections: lines.join('\n'),
  };
}
