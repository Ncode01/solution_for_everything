import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CheckSquare,
  FolderKanban,
  Handshake,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { User } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { buildAttention } from '../../lib/attention';
import {
  getActiveProjectsCount,
  getBudgetSummary,
  getNextDeadlines,
  getOverdueTasks,
  getPendingApprovalPR,
  getProjectHealth,
} from '../../lib/stats';
import { formatCurrency, formatDateShort, todayISO } from '../../lib/dateUtils';
import QuickAddMenu from '../../components/QuickAddMenu';
import StatusBadge from '../../components/StatusBadge';
import StatusDot from '../../components/design/StatusDot';
import PersonToken from '../../components/design/PersonToken';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import MetricCapsule from '../../components/layout/MetricCapsule';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';
import ViewAllButton from '../../components/layout/ViewAllButton';

interface Props {
  user: User;
}

export default function TodayPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { projects, sponsors, meetings, approvals, transactions, members, activityItems } = data;
  const attentionGroups = useMemo(() => buildAttention(data), [data]);
  const totalAttention = attentionGroups.reduce((sum, group) => sum + group.items.length, 0);
  const overdueTasks = getOverdueTasks(projects);
  const pendingLaunches = getPendingApprovalPR(projects);
  const pendingApprovals = approvals.filter((item) => item.status === 'Submitted' || item.status === 'Changes Requested');
  const activeProjects = projects.filter((project) => ['Planning', 'Active', 'Event Week'].includes(project.status));
  const today = todayISO();

  const dueToday = useMemo(() => {
    const items: Array<{ id: string; title: string; meta: string; due: string; link: string }> = [];
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (task.dueDate === today && task.status !== 'Done' && task.status !== 'Approved') {
          items.push({
            id: task.id,
            title: task.title,
            meta: `${project.name} · task`,
            due: task.dueDate,
            link: `/projects/${project.id}`,
          });
        }
      });
      project.milestones.forEach((milestone) => {
        if (milestone.dueDate === today && milestone.status !== 'Completed' && milestone.status !== 'Cancelled') {
          items.push({
            id: milestone.id,
            title: milestone.name,
            meta: `${project.name} · milestone`,
            due: milestone.dueDate,
            link: `/projects/${project.id}`,
          });
        }
      });
      project.prItems.forEach((launch) => {
        if (launch.publishDate === today && launch.publishingStatus !== 'Posted' && launch.publishingStatus !== 'Archived') {
          items.push({
            id: launch.id,
            title: launch.title,
            meta: `${project.name} · launch`,
            due: launch.publishDate,
            link: '/launches',
          });
        }
      });
    });
    meetings.forEach((meeting) => {
      if (meeting.date === today) {
        items.push({
          id: meeting.id,
          title: meeting.title,
          meta: `${projects.find((project) => project.id === meeting.projectId)?.name ?? 'General'} · meeting`,
          due: meeting.date,
          link: '/meetings',
        });
      }
    });
    sponsors.forEach((sponsor) => {
      if (sponsor.nextFollowUpDate === today && sponsor.stage !== 'Completed' && sponsor.stage !== 'Rejected') {
        items.push({
          id: sponsor.id,
          title: `Follow up: ${sponsor.name}`,
          meta: `${projects.find((project) => project.id === sponsor.projectId)?.name ?? 'General'} · sponsor`,
          due: sponsor.nextFollowUpDate,
          link: '/money',
        });
      }
    });
    return items;
  }, [meetings, projects, sponsors, today]);

  const projectPulse = activeProjects
    .map((project) => ({
      project,
      health: getProjectHealth(project, data),
      next: getNextDeadlines(project, 1)[0],
    }))
    .sort((a, b) => (a.next?.date ?? '9999').localeCompare(b.next?.date ?? '9999'))
    .slice(0, 3);

  const nextDueItem = dueToday[0] ?? attentionGroups.flatMap((group) => group.items)[0];
  const nextMeeting = meetings
    .filter((meeting) => meeting.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];

  const moneySummary = activeProjects.reduce((acc, project) => {
    const summary = getBudgetSummary(data, project.id);
    return {
      confirmedIncome: acc.confirmedIncome + summary.confirmedIncome,
      missingReceipts: acc.missingReceipts + summary.missingReceipts,
      actualExpense: acc.actualExpense + summary.actualExpense,
    };
  }, { confirmedIncome: 0, missingReceipts: 0, actualExpense: 0 });

  const quickActions = [
    { label: 'New Project', icon: FolderKanban, onClick: () => navigate('/projects?new=1') },
    { label: 'New Meeting', icon: CalendarCheck, onClick: () => navigate('/meetings?new=1') },
    { label: 'New Sponsor', icon: Handshake, onClick: () => navigate('/money?new=1') },
    { label: 'New Approval', icon: CheckSquare, onClick: () => navigate('/approvals?new=1') },
    { label: 'Open Event Day', icon: Sparkles, onClick: () => navigate('/event-day') },
  ];
  const visibleItems = <T,>(items: T[], key: string, limit = 6) => expandedSections[key] ? items : items.slice(0, limit);

  return (
    <ScreenCanvas variant="cockpit">
      <CommandHero
        title="Today"
        description={`RCCS needs attention in ${totalAttention} place${totalAttention === 1 ? '' : 's'}. Handle the most urgent items first.`}
        tone="attention"
        primaryAction={<QuickAddMenu actions={quickActions} />}
        metrics={[
          { label: 'Active Projects', value: getActiveProjectsCount(projects) },
          { label: 'Needs Attention', value: totalAttention, tone: totalAttention > 0 ? 'warning' : 'default' },
          { label: 'Pending Approvals', value: pendingApprovals.length + pendingLaunches.length, tone: 'warning' },
          { label: 'Overdue Tasks', value: overdueTasks.length, tone: overdueTasks.length > 0 ? 'danger' : 'default' },
        ]}
      >
        <div className="text-xs text-[var(--text-tertiary)]">
          {user.displayName} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </CommandHero>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <WorkQueue title="Needs attention">
            {attentionGroups.length === 0 ? (
              <EmptyMoment
                icon={<AlertTriangle size={20} />}
                title="All clear"
                description="Nothing is currently flagged as urgent."
              />
            ) : (
              visibleItems(attentionGroups.flatMap((group) => group.items.map((item) => ({ ...item, group }))), 'attention').map((entry) => (
                <WorkQueueRow
                  key={`${entry.group.key}-${entry.id}`}
                  title={entry.title}
                  meta={`${entry.group.label} · ${entry.meta}`}
                  owner={<span>Queue</span>}
                  due={entry.date ? formatDateShort(entry.date) : 'No date'}
                  status={entry.badge ? <StatusBadge status={entry.badge} /> : <StatusDot label={entry.group.label} tone={entry.group.tone === 'danger' ? 'red' : entry.group.tone === 'warning' ? 'amber' : 'blue'} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate(entry.link)}>Open</button>}
                  tone={entry.group.tone === 'danger' ? 'critical' : entry.group.tone === 'warning' ? 'warning' : 'accent'}
                />
              ))
            )}
            {totalAttention > 6 && <ViewAllButton count={totalAttention} label={expandedSections.attention ? 'Collapse' : `+${totalAttention - 6} more`} compact onClick={() => setExpandedSections((current) => ({ ...current, attention: !current.attention }))} />}
          </WorkQueue>

          <WorkQueue title="Due today">
            {dueToday.length === 0 ? (
              <EmptyMoment title="Nothing is due today" description="Today has room for follow-through and preparation." />
            ) : (
              visibleItems(dueToday, 'due').map((item) => (
                <WorkQueueRow
                  key={item.id}
                  title={item.title}
                  meta={item.meta}
                  due={formatDateShort(item.due)}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate(item.link)}>Open</button>}
                  tone="accent"
                />
              ))
            )}
            {dueToday.length > 6 && <ViewAllButton count={dueToday.length} label={expandedSections.due ? 'Collapse' : `+${dueToday.length - 6} more`} compact onClick={() => setExpandedSections((current) => ({ ...current, due: !current.due }))} />}
          </WorkQueue>

          <WorkQueue title="Recent activity">
            {(activityItems ?? []).length === 0 ? (
              <EmptyMoment title="No activity yet" description="New work updates will appear here as the team moves." />
            ) : (
              visibleItems([...(activityItems ?? [])].slice(-12).reverse(), 'activity').map((item) => (
                <WorkQueueRow
                  key={item.id}
                  title={item.summary}
                  meta={item.projectId ? projects.find((project) => project.id === item.projectId)?.name ?? 'RCCS OS' : 'RCCS OS'}
                  due={new Date(item.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  tone="neutral"
                />
              ))
            )}
            {(activityItems ?? []).length > 6 && <ViewAllButton count={(activityItems ?? []).length} label={expandedSections.activity ? 'Collapse' : `+${Math.max((activityItems ?? []).length - 6, 0)} more`} compact onClick={() => setExpandedSections((current) => ({ ...current, activity: !current.activity }))} />}
          </WorkQueue>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Now</div>
            <MetricCapsule label="Date" value={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} detail={new Date().toLocaleDateString('en-GB', { weekday: 'long' })} />
            <MetricCapsule label="Next due item" value={nextDueItem?.title ?? 'No immediate due items'} detail={typeof nextDueItem?.meta === 'string' ? nextDueItem.meta : 'due' in (nextDueItem ?? {}) && nextDueItem?.due ? formatDateShort(nextDueItem.due) : 'Clear runway'} tone="accent" />
            <MetricCapsule label="Next meeting" value={nextMeeting?.title ?? 'No upcoming meetings'} detail={nextMeeting ? `${formatDateShort(nextMeeting.date)} · ${nextMeeting.time}` : 'No meeting scheduled'} />
          </Card>

          <Card className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Project pulse</div>
            {projectPulse.length === 0 ? (
              <div className="text-sm text-[var(--text-tertiary)]">No active projects yet.</div>
            ) : (
              projectPulse.map(({ project, health, next }) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex w-full items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)]">{project.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{next ? `${next.label} · ${formatDateShort(next.date)}` : 'No upcoming date'}</div>
                  </div>
                  <StatusDot label={health.label} tone={health.label === 'Healthy' ? 'emerald' : health.label === 'Needs Attention' ? 'amber' : 'red'} lozenge />
                </button>
              ))
            )}
          </Card>

          <Card className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Money pulse</div>
            <MetricCapsule label="Confirmed sponsor amount" value={formatCurrency(moneySummary.confirmedIncome)} tone="success" />
            <MetricCapsule label="Missing receipts" value={moneySummary.missingReceipts} tone={moneySummary.missingReceipts > 0 ? 'warning' : 'default'} />
            <MetricCapsule label="Recorded expense" value={formatCurrency(moneySummary.actualExpense)} tone="danger" />
            <button className="btn-secondary w-full" onClick={() => navigate('/money')}>
              Open Money
            </button>
          </Card>
        </div>
      </div>
    </ScreenCanvas>
  );
}
