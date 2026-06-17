import { AppData, Project } from '../types';
import { getBudgetSummary, getSponsorTotals } from './stats';
import { formatDate, formatCurrency, isOverdue, todayISO } from './dateUtils';

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
