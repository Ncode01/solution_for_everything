import { AppData, Project } from '../types';
import { isOverdue, isDueSoon, daysUntil } from './dateUtils';

export interface AttentionItem {
  id: string;
  title: string;
  meta: string;
  date?: string;
  badge?: string;
  link: string;
}

export interface AttentionGroup {
  key: string;
  label: string;
  tone: 'danger' | 'warning' | 'info';
  items: AttentionItem[];
}

function projectName(projects: Project[], id?: string): string {
  if (!id) return 'General';
  return projects.find((p) => p.id === id)?.name ?? 'Unknown project';
}

export function buildAttention(data: AppData): AttentionGroup[] {
  const { projects, sponsors, transactions, meetings, approvals } = data;
  const groups: AttentionGroup[] = [];

  // Overdue tasks
  const overdueTasks: AttentionItem[] = [];
  const dueSoonTasks: AttentionItem[] = [];
  projects.forEach((p) => {
    p.tasks.forEach((t) => {
      if (t.status === 'Done' || t.status === 'Approved' || !t.dueDate) return;
      if (isOverdue(t.dueDate)) {
        overdueTasks.push({
          id: t.id,
          title: t.title,
          meta: `${p.name} · ${t.assignee || 'Unassigned'}`,
          date: t.dueDate,
          badge: t.priority,
          link: `/projects/${p.id}`,
        });
      } else if (isDueSoon(t.dueDate, 2)) {
        dueSoonTasks.push({
          id: t.id,
          title: t.title,
          meta: `${p.name} · ${t.assignee || 'Unassigned'}`,
          date: t.dueDate,
          badge: daysUntil(t.dueDate) === 0 ? 'Today' : 'Soon',
          link: `/projects/${p.id}`,
        });
      }
    });
  });
  if (overdueTasks.length)
    groups.push({ key: 'overdue-tasks', label: 'Overdue tasks', tone: 'danger', items: overdueTasks });
  if (dueSoonTasks.length)
    groups.push({ key: 'due-soon-tasks', label: 'Tasks due today / tomorrow', tone: 'warning', items: dueSoonTasks });

  // PR needing approval + PR scheduled soon
  const prApproval: AttentionItem[] = [];
  const prSoon: AttentionItem[] = [];
  projects.forEach((p) => {
    p.prItems.forEach((pr) => {
      if (pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review') {
        prApproval.push({
          id: pr.id,
          title: pr.title,
          meta: `${p.name} · ${pr.platform}`,
          badge: pr.approvalStatus,
          link: '/launches',
        });
      }
      if (
        pr.publishDate &&
        pr.publishingStatus !== 'Posted' &&
        pr.publishingStatus !== 'Archived' &&
        isDueSoon(pr.publishDate, 7)
      ) {
        prSoon.push({
          id: `soon-${pr.id}`,
          title: pr.title,
          meta: `${p.name} · ${pr.platform}`,
          date: pr.publishDate,
          badge: pr.publishingStatus,
          link: '/launches',
        });
      }
    });
  });
  if (prApproval.length)
    groups.push({ key: 'pr-approval', label: 'Launches needing approval', tone: 'warning', items: prApproval });
  if (prSoon.length)
    groups.push({ key: 'pr-soon', label: 'Launches scheduled soon', tone: 'info', items: prSoon });

  // Sponsor follow-ups + unpaid confirmed
  const sponsorFollowUps: AttentionItem[] = [];
  const sponsorPayments: AttentionItem[] = [];
  sponsors.forEach((s) => {
    if (
      s.nextFollowUpDate &&
      s.stage !== 'Confirmed' &&
      s.stage !== 'Rejected' &&
      s.stage !== 'Completed' &&
      (isOverdue(s.nextFollowUpDate) || isDueSoon(s.nextFollowUpDate, 3))
    ) {
      sponsorFollowUps.push({
        id: `fu-${s.id}`,
        title: `Follow up: ${s.name}`,
        meta: `${projectName(projects, s.projectId)} · ${s.assignedMember || 'Unassigned'}`,
        date: s.nextFollowUpDate,
        badge: s.stage,
        link: '/budget',
      });
    }
    const unpaid = s.paymentStatus !== 'Paid' && s.paymentStatus !== 'Not Requested';
    if ((s.paymentStatus === 'Overdue') || ((s.stage === 'Confirmed' || s.stage === 'Completed') && unpaid && s.amount > 0)) {
      sponsorPayments.push({
        id: `pay-${s.id}`,
        title: `${s.name} — payment ${s.paymentStatus}`,
        meta: `${projectName(projects, s.projectId)} · Rs ${s.amount.toLocaleString('en-LK')}`,
        badge: s.paymentStatus,
        link: '/budget',
      });
    }
  });
  if (sponsorFollowUps.length)
    groups.push({ key: 'sponsor-followups', label: 'Sponsor follow-ups due', tone: 'warning', items: sponsorFollowUps });
  if (sponsorPayments.length)
    groups.push({ key: 'sponsor-payments', label: 'Sponsor payments to chase', tone: 'danger', items: sponsorPayments });

  // Budget: missing receipts on expenses
  const missingReceipts: AttentionItem[] = transactions
    .filter((t) => t.type === 'Expense' && !t.receiptLink)
    .map((t) => ({
      id: `rcpt-${t.id}`,
      title: `Missing receipt: ${t.category}`,
      meta: `${projectName(projects, t.projectId)} · Rs ${t.amount.toLocaleString('en-LK')}`,
      date: t.date,
      link: '/money',
    }));
  if (missingReceipts.length > 0)
    groups.push({ key: 'missing-receipts', label: 'Expenses missing receipts', tone: 'info', items: missingReceipts });

  // Meeting action items overdue / due soon
  const meetingActions: AttentionItem[] = [];
  meetings.forEach((m) => {
    m.actionItems.forEach((a) => {
      if (a.status === 'Done' || a.status === 'Cancelled' || !a.dueDate) return;
      if (isOverdue(a.dueDate) || isDueSoon(a.dueDate, 3)) {
        meetingActions.push({
          id: a.id,
          title: a.title,
          meta: `${m.title} · ${a.owner || 'Unassigned'}`,
          date: a.dueDate,
          badge: isOverdue(a.dueDate) ? 'Overdue' : 'Soon',
          link: '/meetings',
        });
      }
    });
  });
  if (meetingActions.length)
    groups.push({ key: 'meeting-actions', label: 'Meeting action items due', tone: 'warning', items: meetingActions });

  // Approvals pending
  const pendingApprovals: AttentionItem[] = approvals
    .filter((a) => a.status === 'Submitted')
    .map((a) => ({
      id: a.id,
      title: a.title,
      meta: `${projectName(projects, a.projectId)} · ${a.approver}`,
      date: a.submittedDate,
      badge: a.status,
      link: '/approvals',
    }));
  if (pendingApprovals.length)
    groups.push({ key: 'approvals', label: 'Approval requests pending', tone: 'info', items: pendingApprovals });

  return groups;
}

export function countAttention(groups: AttentionGroup[]): number {
  return groups.reduce((sum, g) => sum + g.items.length, 0);
}
