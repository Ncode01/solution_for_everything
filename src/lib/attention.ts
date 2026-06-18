import { AppData, Project } from '../types';
import { isOverdue, isDueSoon, daysUntil } from './dateUtils';
import { getPRWorkflowStatus, getDesignBrief } from './prWorkflow';
import { ensureApprovalStages, getCurrentStage } from './approvalStages';

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
  const { projects, sponsors, transactions, meetings, approvals, deliverables = [] } = data;
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

  // PR workflow attention
  const prApproval: AttentionItem[] = [];
  const prSoon: AttentionItem[] = [];
  const prWorkflow: AttentionItem[] = [];
  projects.forEach((p) => {
    p.prItems.forEach((pr) => {
      const status = getPRWorkflowStatus(pr);
      if (status === 'In Approval' || status === 'Design Submitted') {
        prApproval.push({
          id: pr.id,
          title: pr.title,
          meta: `${p.name} · ${pr.platform}`,
          badge: status,
          link: '/launches',
        });
      }
      if (status === 'Draft' && (!getDesignBrief(pr).trim() || !(pr.designerId || pr.designer))) {
        prWorkflow.push({
          id: `wf-${pr.id}`,
          title: pr.title,
          meta: `${p.name} · missing brief or designer`,
          badge: 'Draft',
          link: '/launches',
        });
      }
      if (status === 'Sent to Designer') {
        prWorkflow.push({
          id: `wf-${pr.id}`,
          title: pr.title,
          meta: `${p.name} · waiting designer accept`,
          badge: status,
          link: '/launches',
        });
      }
      if (status === 'Ready to Launch' && !pr.publishDate) {
        prWorkflow.push({
          id: `wf-${pr.id}`,
          title: pr.title,
          meta: `${p.name} · no publish date`,
          badge: status,
          link: '/launches',
        });
      }
      if (
        pr.publishDate &&
        status !== 'Posted' &&
        status !== 'Archived' &&
        isDueSoon(pr.publishDate, 7)
      ) {
        prSoon.push({
          id: `soon-${pr.id}`,
          title: pr.title,
          meta: `${p.name} · ${pr.platform}`,
          date: pr.publishDate,
          badge: status,
          link: '/launches',
        });
      }
    });
  });
  if (prApproval.length)
    groups.push({ key: 'pr-approval', label: 'Launches in approval', tone: 'warning', items: prApproval });
  if (prWorkflow.length)
    groups.push({ key: 'pr-workflow', label: 'Launch workflow needs action', tone: 'warning', items: prWorkflow });
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
        link: '/money',
      });
    }
    const unpaid = s.paymentStatus !== 'Paid' && s.paymentStatus !== 'Not Requested';
    if ((s.paymentStatus === 'Overdue') || ((s.stage === 'Confirmed' || s.stage === 'Completed') && unpaid && s.amount > 0)) {
      sponsorPayments.push({
        id: `pay-${s.id}`,
        title: `${s.name} — payment ${s.paymentStatus}`,
        meta: `${projectName(projects, s.projectId)} · Rs ${s.amount.toLocaleString('en-LK')}`,
        badge: s.paymentStatus,
        link: '/money',
      });
    }
  });
  if (sponsorFollowUps.length)
    groups.push({ key: 'sponsor-followups', label: 'Sponsor follow-ups due', tone: 'warning', items: sponsorFollowUps });
  if (sponsorPayments.length)
    groups.push({ key: 'sponsor-payments', label: 'Sponsor payments to chase', tone: 'danger', items: sponsorPayments });

  // Budget: missing receipts + missing quotations on expenses
  const missingReceipts: AttentionItem[] = transactions
    .filter((t) => t.type === 'Expense' && !t.receiptLink)
    .map((t) => ({
      id: `rcpt-${t.id}`,
      title: `Missing receipt: ${t.category}`,
      meta: `${projectName(projects, t.projectId)} · Rs ${t.amount.toLocaleString('en-LK')}`,
      date: t.date,
      link: '/money',
    }));
  const missingQuotes: AttentionItem[] = transactions
    .filter((t) => t.type === 'Expense' && (t.quotations?.filter((q) => q.sellerName.trim()).length ?? 0) < 3)
    .map((t) => ({
      id: `quote-${t.id}`,
      title: `Missing quotations: ${t.category}`,
      meta: `${projectName(projects, t.projectId)} · ${t.quotations?.filter((q) => q.sellerName.trim()).length ?? 0}/3 quotes`,
      date: t.date,
      link: '/money',
    }));
  if (missingReceipts.length > 0)
    groups.push({ key: 'missing-receipts', label: 'Expenses missing receipts', tone: 'info', items: missingReceipts });
  if (missingQuotes.length > 0)
    groups.push({ key: 'missing-quotes', label: 'Expenses missing quotations', tone: 'warning', items: missingQuotes });

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

  // Approvals pending + stage timelines
  const pendingApprovals: AttentionItem[] = [];
  const overdueStages: AttentionItem[] = [];
  approvals.forEach((a) => {
    const stages = ensureApprovalStages(a);
    const current = getCurrentStage(stages);
    if (a.status === 'Submitted' || a.status === 'Changes Requested') {
      pendingApprovals.push({
        id: a.id,
        title: a.title,
        meta: `${projectName(projects, a.projectId)} · ${current?.title ?? a.approver}`,
        date: a.submittedDate,
        badge: a.status,
        link: '/approvals',
      });
    }
    if (current?.dueDate && isOverdue(current.dueDate) && current.status === 'Pending') {
      overdueStages.push({
        id: `stage-${a.id}`,
        title: `${a.title} — ${current.title}`,
        meta: projectName(projects, a.projectId),
        date: current.dueDate,
        badge: 'Overdue stage',
        link: '/approvals',
      });
    }
  });
  if (pendingApprovals.length)
    groups.push({ key: 'approvals', label: 'Approval processes pending', tone: 'info', items: pendingApprovals });
  if (overdueStages.length)
    groups.push({ key: 'approval-stages', label: 'Overdue approval stages', tone: 'danger', items: overdueStages });

  // Overdue deliverables (not completed/approved/published)
  const overdueDeliverables: AttentionItem[] = deliverables
    .filter((d) => d.dueDate && isOverdue(d.dueDate) && !['Completed', 'Approved', 'Published', 'Archived'].includes(d.status))
    .map((d) => ({
      id: d.id,
      title: d.title,
      meta: `${projectName(projects, d.projectId)} · ${d.type}`,
      date: d.dueDate,
      badge: d.status,
      link: `/projects/${d.projectId}`,
    }));
  if (overdueDeliverables.length)
    groups.push({ key: 'overdue-deliverables', label: 'Overdue deliverables', tone: 'warning', items: overdueDeliverables });

  // Event-day problems
  const eventDayProblems: AttentionItem[] = (data.eventDayItems ?? [])
    .filter((e) => e.status === 'Problem')
    .map((e) => ({
      id: e.id,
      title: e.title,
      meta: `${projectName(projects, e.projectId)} · ${e.category}`,
      badge: 'Problem',
      link: `/event-day?project=${e.projectId}`,
    }));
  if (eventDayProblems.length)
    groups.push({ key: 'event-day-problems', label: 'Event-day problems', tone: 'danger', items: eventDayProblems });

  return groups;
}

export function countAttention(groups: AttentionGroup[]): number {
  return groups.reduce((sum, g) => sum + g.items.length, 0);
}
