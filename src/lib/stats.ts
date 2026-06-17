import { Project, Task, PRItem, AppData, Transaction, Sponsor } from '../types';
import { isOverdue, isDueSoon, isThisWeek } from './dateUtils';

export function getActiveProjectsCount(projects: Project[]): number {
  return projects.filter((p) => p.status === 'Active' || p.status === 'Event Week').length;
}

export function getAllTasks(projects: Project[]): Task[] {
  return projects.flatMap((p) => p.tasks);
}

export function getOverdueTasks(projects: Project[]): Task[] {
  return getAllTasks(projects).filter(
    (t) => isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Approved'
  );
}

export function getUpcomingDeadlines(projects: Project[]): Array<{
  label: string;
  date: string;
  type: 'task' | 'milestone' | 'event';
  projectName: string;
}> {
  const items: Array<{ label: string; date: string; type: 'task' | 'milestone' | 'event'; projectName: string }> = [];
  projects.forEach((p) => {
    p.tasks.forEach((t) => {
      if (isDueSoon(t.dueDate, 14) && t.status !== 'Done' && t.status !== 'Approved') {
        items.push({ label: t.title, date: t.dueDate, type: 'task', projectName: p.name });
      }
    });
    p.milestones.forEach((m) => {
      if (isDueSoon(m.dueDate, 14) && m.status !== 'Completed' && m.status !== 'Cancelled') {
        items.push({ label: m.name, date: m.dueDate, type: 'milestone', projectName: p.name });
      }
    });
    if (p.finalEventDate && isDueSoon(p.finalEventDate, 30)) {
      items.push({ label: `${p.name} — Final Event`, date: p.finalEventDate, type: 'event', projectName: p.name });
    }
  });
  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getAllPRItems(projects: Project[]): (PRItem & { projectName: string })[] {
  return projects.flatMap((p) =>
    p.prItems.map((pr) => ({ ...pr, projectName: p.name }))
  );
}

export function getPRThisWeek(projects: Project[]): PRItem[] {
  return getAllPRItems(projects).filter((pr) => isThisWeek(pr.publishDate));
}

export function getPendingApprovalPR(projects: Project[]): PRItem[] {
  return getAllPRItems(projects).filter(
    (pr) => pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review'
  );
}

// --- Phase Two cross-module helpers ---

export interface BudgetSummary {
  expectedIncome: number;
  expectedExpense: number;
  confirmedIncome: number;
  confirmedExpense: number;
  actualIncome: number;
  actualExpense: number;
  surplus: number;
  usagePct: number;
  missingReceipts: number;
}

export function getProjectTransactions(data: AppData, projectId: string): Transaction[] {
  return data.transactions.filter((t) => t.projectId === projectId);
}

export function getBudgetSummary(data: AppData, projectId: string): BudgetSummary {
  const budget = data.budgets.find((b) => b.projectId === projectId);
  const txns = getProjectTransactions(data, projectId);
  const actualIncome = txns.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const actualExpense = txns.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const expectedIncome = budget?.expectedIncome ?? 0;
  const expectedExpense = budget?.expectedExpense ?? 0;
  const confirmedIncome = budget?.confirmedIncome ?? 0;
  const confirmedExpense = budget?.confirmedExpense ?? 0;
  const surplus = actualIncome + confirmedIncome - (actualExpense + confirmedExpense);
  const usagePct = expectedExpense > 0 ? Math.round((actualExpense / expectedExpense) * 100) : 0;
  const missingReceipts = txns.filter((t) => t.type === 'Expense' && !t.receiptLink).length;
  return {
    expectedIncome,
    expectedExpense,
    confirmedIncome,
    confirmedExpense,
    actualIncome,
    actualExpense,
    surplus,
    usagePct,
    missingReceipts,
  };
}

export function getSponsorTotals(sponsors: Sponsor[]): {
  total: number;
  confirmed: number;
  pipeline: number;
  count: number;
} {
  const confirmedStages = ['Confirmed', 'Completed'];
  const confirmed = sponsors
    .filter((s) => confirmedStages.includes(s.stage))
    .reduce((sum, s) => sum + s.amount, 0);
  const pipeline = sponsors
    .filter((s) => !confirmedStages.includes(s.stage) && s.stage !== 'Rejected')
    .reduce((sum, s) => sum + s.amount, 0);
  const total = sponsors.reduce((sum, s) => sum + s.amount, 0);
  return { total, confirmed, pipeline, count: sponsors.length };
}

export interface ProjectHealth {
  score: number;
  label: 'Healthy' | 'Needs Attention' | 'At Risk';
  overdueCount: number;
  pendingApprovals: number;
}

export function getProjectHealth(project: Project, data: AppData): ProjectHealth {
  const overdueCount = project.tasks.filter(
    (t) => isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Approved'
  ).length;
  const pendingApprovals = data.approvals.filter(
    (a) => a.projectId === project.id && (a.status === 'Submitted' || a.status === 'Changes Requested')
  ).length;
  const pendingPR = project.prItems.filter(
    (pr) => pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review'
  ).length;

  let score = 100;
  score -= overdueCount * 12;
  score -= pendingApprovals * 8;
  score -= pendingPR * 4;
  if (project.status !== 'Completed' && project.status !== 'Archived' && project.progress < 25) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const label: ProjectHealth['label'] = score >= 75 ? 'Healthy' : score >= 45 ? 'Needs Attention' : 'At Risk';
  return { score, label, overdueCount, pendingApprovals };
}

export function getNextDeadlines(project: Project, count = 5): Array<{ label: string; date: string; type: string }> {
  return [
    ...project.milestones
      .filter((m) => m.status !== 'Completed' && m.status !== 'Cancelled' && m.dueDate)
      .map((m) => ({ label: m.name, date: m.dueDate, type: 'Milestone' })),
    ...project.tasks
      .filter((t) => t.status !== 'Done' && t.status !== 'Approved' && t.dueDate)
      .map((t) => ({ label: t.title, date: t.dueDate, type: 'Task' })),
    ...(project.finalEventDate ? [{ label: `${project.name} — Final Event`, date: project.finalEventDate, type: 'Event' }] : []),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, count);
}
