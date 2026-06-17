import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo, Rocket, Handshake, ShieldCheck, Crosshair,
  AlertCircle, User, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { User as AppUser } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { isOverdue, daysUntil, formatDateShort } from '../../lib/dateUtils';
import EmptyState from '../../components/EmptyState';

interface Props {
  user: AppUser;
}

function DateLabel({ date }: { date: string }) {
  if (!date) return null;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (date < today) return <span className="text-red-400 font-medium text-xs">Overdue · {formatDateShort(date)}</span>;
  if (date === today) return <span className="text-blue-400 font-medium text-xs">Today</span>;
  if (date === tomorrow) return <span className="text-amber-400 font-medium text-xs">Tomorrow</span>;
  const d = daysUntil(date);
  if (d <= 7) return <span className="text-amber-400 text-xs">{d}d · {formatDateShort(date)}</span>;
  return <span className="text-slate-500 text-xs">{formatDateShort(date)}</span>;
}

function WorkItem({
  title, meta, date, badge, accent, onClick,
}: {
  title: string; meta: string; date?: string; badge?: string;
  accent?: 'red' | 'amber' | 'blue'; onClick?: () => void;
}) {
  const borderColor = accent === 'red' ? 'border-l-red-500' : accent === 'amber' ? 'border-l-amber-500' : 'border-l-blue-500';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-slate-900 border border-slate-800 border-l-2 ${borderColor} rounded-lg px-3 py-2.5 hover:border-slate-700 transition-colors flex items-center justify-between gap-3`}
    >
      <div className="min-w-0">
        <p className="text-sm text-slate-200 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{meta}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && <StatusBadge status={badge} />}
        {date && <DateLabel date={date} />}
      </div>
    </button>
  );
}

function Section({ icon, title, count, children, empty }: {
  icon: React.ReactNode; title: string; count: number;
  children: React.ReactNode; empty: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {count > 0 && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {count === 0 ? (
        <div className="text-xs text-slate-600 px-1 py-2">{empty}</div>
      ) : children}
    </div>
  );
}

export default function FocusPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();

  const myMember = useMemo(() => {
    const lower = user.username.toLowerCase();
    const byUsername = data.members.find((m) => m.name.toLowerCase().includes(lower) || m.displayName.toLowerCase().includes(lower));
    if (byUsername) return byUsername;
    if (user.role === 'Super Admin' || user.role === 'Executive Admin') {
      return data.members.find((m) => m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('chairman'));
    }
    return data.members[0] ?? null;
  }, [user, data.members]);

  const myId = myMember?.id;

  const myTasks = useMemo(() => {
    const tasks: Array<{ task: typeof data.projects[0]['tasks'][0]; projectName: string; projectId: string }> = [];
    data.projects.forEach((p) => {
      p.tasks.forEach((t) => {
        const isAssigned = (t.assigneeId && t.assigneeId === myId) || (!t.assigneeId && t.assignee === myMember?.displayName);
        if (isAssigned && t.status !== 'Done' && t.status !== 'Approved') {
          tasks.push({ task: t, projectName: p.name, projectId: p.id });
        }
      });
    });
    return tasks.sort((a, b) => (a.task.dueDate || '9').localeCompare(b.task.dueDate || '9'));
  }, [data.projects, myId, myMember]);

  const myLaunches = useMemo(() => {
    const items: Array<{ pr: typeof data.projects[0]['prItems'][0]; projectName: string; projectId: string; role: string }> = [];
    data.projects.forEach((p) => {
      p.prItems.forEach((pr) => {
        if (pr.publishingStatus === 'Archived' || pr.publishingStatus === 'Posted') return;
        const roles: string[] = [];
        if ((pr.designerId && pr.designerId === myId) || (!pr.designerId && pr.designer === myMember?.displayName)) roles.push('Designer');
        if ((pr.captionWriterId && pr.captionWriterId === myId) || (!pr.captionWriterId && pr.captionWriter === myMember?.displayName)) roles.push('Caption Writer');
        if ((pr.reviewerId && pr.reviewerId === myId) || (!pr.reviewerId && pr.reviewer === myMember?.displayName)) roles.push('Reviewer');
        if (roles.length > 0) items.push({ pr, projectName: p.name, projectId: p.id, role: roles.join(', ') });
      });
    });
    return items.sort((a, b) => (a.pr.publishDate || '9').localeCompare(b.pr.publishDate || '9'));
  }, [data.projects, myId, myMember]);

  const myActionItems = useMemo(() => {
    const items: Array<{ action: typeof data.meetings[0]['actionItems'][0]; meetingTitle: string }> = [];
    data.meetings.forEach((m) => {
      m.actionItems.forEach((a) => {
        const isOwner = (a.ownerId && a.ownerId === myId) || (!a.ownerId && a.owner === myMember?.displayName);
        if (isOwner && a.status !== 'Done' && a.status !== 'Cancelled') {
          items.push({ action: a, meetingTitle: m.title });
        }
      });
    });
    return items.sort((a, b) => (a.action.dueDate || '9').localeCompare(b.action.dueDate || '9'));
  }, [data.meetings, myId, myMember]);

  const mySponsorFollowUps = useMemo(() => {
    return data.sponsors.filter((s) => {
      const isAssigned = (s.assignedMemberId && s.assignedMemberId === myId) || (!s.assignedMemberId && s.assignedMember === myMember?.displayName);
      return isAssigned && s.stage !== 'Completed' && s.stage !== 'Rejected';
    }).sort((a, b) => (a.nextFollowUpDate || '9').localeCompare(b.nextFollowUpDate || '9'));
  }, [data.sponsors, myId, myMember]);

  const myApprovals = useMemo(() => {
    return data.approvals.filter((a) => {
      const isApprover = (a.approverId && a.approverId === myId) || (!a.approverId && a.approver === myMember?.displayName);
      return isApprover && a.status !== 'Approved' && a.status !== 'Rejected';
    });
  }, [data.approvals, myId, myMember]);

  const totalItems = myTasks.length + myLaunches.length + myActionItems.length + mySponsorFollowUps.length + myApprovals.length;
  const overdueCount =
    myTasks.filter((x) => x.task.dueDate && isOverdue(x.task.dueDate)).length +
    myActionItems.filter((x) => x.action.dueDate && isOverdue(x.action.dueDate)).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Focus"
        description={
          myMember
            ? `Your deadlines, approvals, and assignments — ${myMember.displayName} · ${myMember.role}`
            : 'Your deadlines, approvals, and assignments.'
        }
      />

      {/* Profile card */}
      {myMember ? (
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-base font-bold text-blue-300 shrink-0">
            {myMember.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-200">{myMember.displayName}</p>
            <p className="text-xs text-slate-400">{myMember.role} · {myMember.committee}</p>
          </div>
          <div className="flex gap-4 text-center shrink-0">
            <div>
              <p className="text-base font-bold text-slate-200">{totalItems}</p>
              <p className="text-xs text-slate-500">Open</p>
            </div>
            {overdueCount > 0 && (
              <div>
                <p className="text-base font-bold text-red-400">{overdueCount}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 text-amber-300">
          <User size={16} className="shrink-0" />
          <p className="text-sm">
            No member profile linked. Go to{' '}
            <button className="underline" onClick={() => navigate('/people')}>People</button>{' '}
            to create one.
          </p>
        </Card>
      )}

      {totalItems === 0 && myMember && (
        <Card className="py-12 text-center">
          <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">You're clear for now.</p>
          <p className="text-slate-500 text-sm mt-1">New assignments will appear here.</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasks */}
        <Section icon={<ListTodo size={15} />} title="Assigned Tasks" count={myTasks.length} empty="No open tasks assigned to you.">
          <div className="space-y-1.5">
            {myTasks.map(({ task, projectName, projectId }) => (
              <WorkItem
                key={task.id}
                title={task.title}
                meta={`${projectName} · ${task.status}`}
                date={task.dueDate}
                badge={task.priority !== 'Medium' ? task.priority : undefined}
                accent={isOverdue(task.dueDate) ? 'red' : undefined}
                onClick={() => navigate(`/projects/${projectId}`)}
              />
            ))}
          </div>
        </Section>

        {/* Launches */}
        <Section icon={<Rocket size={15} />} title="Launch Work" count={myLaunches.length} empty="No launch work assigned to you.">
          <div className="space-y-1.5">
            {myLaunches.map(({ pr, projectName, role }) => (
              <WorkItem
                key={pr.id}
                title={pr.title}
                meta={`${projectName} · ${role}`}
                date={pr.publishDate}
                badge={pr.approvalStatus !== 'Draft' ? pr.approvalStatus : undefined}
                onClick={() => navigate('/launches')}
              />
            ))}
          </div>
        </Section>

        {/* Meeting Action Items */}
        <Section icon={<Clock size={15} />} title="Meeting Actions" count={myActionItems.length} empty="No open action items from meetings.">
          <div className="space-y-1.5">
            {myActionItems.map(({ action, meetingTitle }) => (
              <WorkItem
                key={action.id}
                title={action.title}
                meta={meetingTitle}
                date={action.dueDate}
                badge={action.status !== 'Open' ? action.status : undefined}
                accent={action.dueDate && isOverdue(action.dueDate) ? 'red' : undefined}
                onClick={() => navigate('/meetings')}
              />
            ))}
          </div>
        </Section>

        {/* Approvals for Me */}
        <Section icon={<ShieldCheck size={15} />} title="Approvals for Me" count={myApprovals.length} empty="No pending approvals assigned to you.">
          <div className="space-y-1.5">
            {myApprovals.map((a) => (
              <WorkItem
                key={a.id}
                title={a.title}
                meta={a.relatedType}
                date={a.submittedDate}
                badge={a.status}
                accent="amber"
                onClick={() => navigate('/approvals')}
              />
            ))}
          </div>
        </Section>

        {/* Sponsor Follow-ups */}
        {mySponsorFollowUps.length > 0 && (
          <Section icon={<Handshake size={15} />} title="Sponsor Follow-ups" count={mySponsorFollowUps.length} empty="">
            <div className="space-y-1.5">
              {mySponsorFollowUps.map((s) => (
                <WorkItem
                  key={s.id}
                  title={s.name}
                  meta={`${s.stage} · ${s.packageName}`}
                  date={s.nextFollowUpDate}
                  badge={s.paymentStatus !== 'Not Requested' ? s.paymentStatus : undefined}
                  accent={s.nextFollowUpDate && isOverdue(s.nextFollowUpDate) ? 'red' : 'amber'}
                  onClick={() => navigate('/money')}
                />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
