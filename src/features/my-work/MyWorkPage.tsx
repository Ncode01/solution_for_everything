import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo, Target, Megaphone, Handshake, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, User,
} from 'lucide-react';
import { User as AppUser } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
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
  if (date === today) return <span className="text-blue-400 font-medium">Today</span>;
  if (date === tomorrow) return <span className="text-amber-400 font-medium">Tomorrow</span>;
  if (date < today) return <span className="text-red-400 font-medium">Overdue · {formatDateShort(date)}</span>;
  const d = daysUntil(date);
  if (d <= 7) return <span className="text-amber-400">{d}d · {formatDateShort(date)}</span>;
  return <span className="text-slate-500">{formatDateShort(date)}</span>;
}

export default function MyWorkPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();

  // Map logged-in user to a member profile
  const myMember = useMemo(() => {
    // Try to find member by username or role heuristic
    const lower = user.username.toLowerCase();
    const byUsername = data.members.find((m) => m.name.toLowerCase().includes(lower));
    if (byUsername) return byUsername;
    // Fallback mapping
    if (user.role === 'Super Admin' || user.role === 'Executive Admin') {
      return data.members.find((m) => m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('chairman'));
    }
    return data.members[0] ?? null;
  }, [user, data.members]);

  const myId = myMember?.id;

  // My open tasks
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
    return tasks.sort((a, b) => (a.task.dueDate || '').localeCompare(b.task.dueDate || ''));
  }, [data.projects, myId, myMember]);

  // My PR assignments
  const myPRItems = useMemo(() => {
    const items: Array<{ pr: typeof data.projects[0]['prItems'][0]; projectName: string; projectId: string; role: string }> = [];
    data.projects.forEach((p) => {
      p.prItems.forEach((pr) => {
        if (pr.publishingStatus === 'Archived' || pr.publishingStatus === 'Posted') return;
        const roles: string[] = [];
        if ((pr.designerId && pr.designerId === myId) || (!pr.designerId && pr.designer === myMember?.displayName)) roles.push('Designer');
        if ((pr.captionWriterId && pr.captionWriterId === myId) || (!pr.captionWriterId && pr.captionWriter === myMember?.displayName)) roles.push('Caption Writer');
        if ((pr.reviewerId && pr.reviewerId === myId) || (!pr.reviewerId && pr.reviewer === myMember?.displayName)) roles.push('Reviewer');
        if (roles.length > 0) {
          items.push({ pr, projectName: p.name, projectId: p.id, role: roles.join(', ') });
        }
      });
    });
    return items.sort((a, b) => (a.pr.publishDate || '').localeCompare(b.pr.publishDate || ''));
  }, [data.projects, myId, myMember]);

  // My meeting action items
  const myActionItems = useMemo(() => {
    const items: Array<{ action: typeof data.meetings[0]['actionItems'][0]; meetingTitle: string; meetingId: string }> = [];
    data.meetings.forEach((m) => {
      m.actionItems.forEach((a) => {
        const isOwner = (a.ownerId && a.ownerId === myId) || (!a.ownerId && a.owner === myMember?.displayName);
        if (isOwner && a.status !== 'Done' && a.status !== 'Cancelled') {
          items.push({ action: a, meetingTitle: m.title, meetingId: m.id });
        }
      });
    });
    return items.sort((a, b) => (a.action.dueDate || '').localeCompare(b.action.dueDate || ''));
  }, [data.meetings, myId, myMember]);

  // My sponsor follow-ups
  const mySponsorFollowUps = useMemo(() => {
    return data.sponsors.filter((s) => {
      const isAssigned = (s.assignedMemberId && s.assignedMemberId === myId) || (!s.assignedMemberId && s.assignedMember === myMember?.displayName);
      return isAssigned && s.stage !== 'Completed' && s.stage !== 'Rejected';
    }).sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [data.sponsors, myId, myMember]);

  // My approvals (as approver)
  const myApprovals = useMemo(() => {
    return data.approvals.filter((a) => {
      const isApprover = (a.approverId && a.approverId === myId) || (!a.approverId && a.approver === myMember?.displayName);
      return isApprover && a.status !== 'Approved' && a.status !== 'Rejected';
    });
  }, [data.approvals, myId, myMember]);

  const totalItems = myTasks.length + myPRItems.length + myActionItems.length + mySponsorFollowUps.length + myApprovals.length;

  const overdueCount = myTasks.filter((x) => x.task.dueDate && isOverdue(x.task.dueDate)).length
    + myActionItems.filter((x) => x.action.dueDate && isOverdue(x.action.dueDate)).length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="My Work"
        description={myMember ? `Work assigned to ${myMember.displayName} · ${myMember.role}` : "Your assigned tasks, posts, action items, and follow-ups."}
      />

      {/* Profile card */}
      {myMember && (
        <div className="card flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg font-bold text-blue-300">
            {myMember.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-200">{myMember.displayName}</p>
            <p className="text-xs text-slate-400">{myMember.role} · {myMember.committee}</p>
          </div>
          <div className="flex gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-slate-200">{totalItems}</p>
              <p className="text-xs text-slate-500">Open Items</p>
            </div>
            {overdueCount > 0 && (
              <div>
                <p className="text-lg font-bold text-red-400">{overdueCount}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!myMember && (
        <div className="card p-4 flex items-center gap-3 text-amber-300 bg-amber-900/10 border-amber-800/30">
          <User size={18} className="shrink-0" />
          <p className="text-sm">No member profile linked to your login. Go to <button className="underline" onClick={() => navigate('/members')}>Members</button> to create one.</p>
        </div>
      )}

      {/* My Tasks */}
      <Section
        icon={<ListTodo size={16} />}
        title="My Tasks"
        count={myTasks.length}
        color="blue"
        empty="No open tasks assigned to you."
      >
        {myTasks.map(({ task, projectName, projectId }) => (
          <ItemRow
            key={task.id}
            label={task.title}
            sub={projectName}
            date={task.dueDate}
            status={task.status}
            onClick={() => navigate(`/projects/${projectId}`)}
            priority={task.priority}
          />
        ))}
      </Section>

      {/* My PR Items */}
      <Section
        icon={<Megaphone size={16} />}
        title="My PR Posts"
        count={myPRItems.length}
        color="violet"
        empty="No active PR posts assigned to you."
      >
        {myPRItems.map(({ pr, projectName, projectId, role }) => (
          <ItemRow
            key={pr.id}
            label={pr.title}
            sub={`${projectName} · ${role}`}
            date={pr.publishDate}
            status={pr.publishingStatus}
            onClick={() => navigate('/pr-planner')}
          />
        ))}
      </Section>

      {/* My Meeting Action Items */}
      <Section
        icon={<CheckCircle2 size={16} />}
        title="My Action Items"
        count={myActionItems.length}
        color="cyan"
        empty="No open action items assigned to you."
      >
        {myActionItems.map(({ action, meetingTitle }) => (
          <ItemRow
            key={action.id}
            label={action.title}
            sub={meetingTitle}
            date={action.dueDate}
            status={action.status}
            onClick={() => navigate('/meetings')}
          />
        ))}
      </Section>

      {/* My Sponsor Follow-ups */}
      <Section
        icon={<Handshake size={16} />}
        title="My Sponsor Follow-ups"
        count={mySponsorFollowUps.length}
        color="orange"
        empty="No sponsor follow-ups assigned to you."
      >
        {mySponsorFollowUps.map((s) => {
          const proj = data.projects.find((p) => p.id === s.projectId);
          return (
            <ItemRow
              key={s.id}
              label={s.name}
              sub={`${proj?.name ?? 'Unknown project'} · ${s.stage}`}
              date={s.nextFollowUpDate}
              status={s.paymentStatus}
              onClick={() => navigate('/budget')}
            />
          );
        })}
      </Section>

      {/* My Pending Approvals */}
      <Section
        icon={<ShieldCheck size={16} />}
        title="Approvals Awaiting Me"
        count={myApprovals.length}
        color="amber"
        empty="No approvals waiting for your decision."
      >
        {myApprovals.map((a) => {
          const proj = a.projectId ? data.projects.find((p) => p.id === a.projectId) : null;
          return (
            <ItemRow
              key={a.id}
              label={a.title}
              sub={`${proj?.name ?? 'General'} · ${a.relatedType}`}
              date={a.submittedDate}
              status={a.status}
              onClick={() => navigate('/approvals')}
            />
          );
        })}
      </Section>

      {totalItems === 0 && myMember && (
        <EmptyState
          icon={<CheckCircle2 size={32} className="text-slate-600" />}
          title="All clear!"
          description="You have no open work items. Check back after the next meeting."
        />
      )}
    </div>
  );
}

function Section({
  icon, title, count, color, empty, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  empty: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue:   'text-blue-400 bg-blue-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    cyan:   'text-cyan-400 bg-cyan-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    amber:  'text-amber-400 bg-amber-500/10',
  };
  const cls = colorMap[color] ?? 'text-slate-400 bg-slate-500/10';
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <span className={`p-1.5 rounded-md ${cls}`}>{icon}</span>
        <span className="font-semibold text-slate-200 text-sm">{title}</span>
        {count > 0 && (
          <span className="ml-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="divide-y divide-slate-800/60">
        {count === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">{empty}</p>
        ) : children}
      </div>
    </div>
  );
}

function ItemRow({
  label, sub, date, status, onClick, priority,
}: {
  label: string;
  sub: string;
  date?: string;
  status?: string;
  onClick: () => void;
  priority?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = date && date < today;
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-slate-800/40 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {priority && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            priority === 'Urgent' ? 'bg-red-900/40 text-red-400' :
            priority === 'High' ? 'bg-amber-900/30 text-amber-400' :
            'text-slate-500'
          }`}>{priority}</span>
        )}
        {date && (
          <span className={`text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            <DateLabel date={date} />
          </span>
        )}
        {status && <StatusBadge status={status} />}
      </div>
    </button>
  );
}
