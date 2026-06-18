import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Handshake, Rocket, ShieldCheck, User, Users } from 'lucide-react';
import { User as AppUser } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { isOverdue, formatDateShort } from '../../lib/dateUtils';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import PersonToken from '../../components/design/PersonToken';
import StatusBadge from '../../components/StatusBadge';

interface Props {
  user: AppUser;
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
  }, [data.members, user]);

  const myId = myMember?.id;

  const myTasks = useMemo(() => data.projects.flatMap((project) =>
    project.tasks
      .filter((task) => ((task.assigneeId && task.assigneeId === myId) || (!task.assigneeId && task.assignee === myMember?.displayName)) && task.status !== 'Done' && task.status !== 'Approved')
      .map((task) => ({ task, project }))
  ).sort((a, b) => (a.task.dueDate || '9999').localeCompare(b.task.dueDate || '9999')), [data.projects, myId, myMember]);

  const myLaunches = useMemo(() => data.projects.flatMap((project) =>
    project.prItems
      .filter((launch) => {
        if (launch.publishingStatus === 'Archived' || launch.publishingStatus === 'Posted') return false;
        return [launch.designerId, launch.captionWriterId, launch.reviewerId].includes(myId) || [launch.designer, launch.captionWriter, launch.reviewer].includes(myMember?.displayName ?? '');
      })
      .map((launch) => ({ launch, project }))
  ).sort((a, b) => (a.launch.publishDate || '9999').localeCompare(b.launch.publishDate || '9999')), [data.projects, myId, myMember]);

  const myActionItems = useMemo(() => data.meetings.flatMap((meeting) =>
    meeting.actionItems
      .filter((action) => ((action.ownerId && action.ownerId === myId) || (!action.ownerId && action.owner === myMember?.displayName)) && action.status !== 'Done' && action.status !== 'Cancelled')
      .map((action) => ({ action, meeting }))
  ).sort((a, b) => (a.action.dueDate || '9999').localeCompare(b.action.dueDate || '9999')), [data.meetings, myId, myMember]);

  const myApprovals = useMemo(() => data.approvals.filter((approval) =>
    ((approval.approverId && approval.approverId === myId) || (!approval.approverId && approval.approver === myMember?.displayName)) &&
    approval.status !== 'Approved' &&
    approval.status !== 'Rejected'
  ), [data.approvals, myId, myMember]);

  const mySponsors = useMemo(() => data.sponsors.filter((sponsor) =>
    ((sponsor.assignedMemberId && sponsor.assignedMemberId === myId) || (!sponsor.assignedMemberId && sponsor.assignedMember === myMember?.displayName)) &&
    sponsor.stage !== 'Completed' &&
    sponsor.stage !== 'Rejected'
  ).sort((a, b) => (a.nextFollowUpDate || '9999').localeCompare(b.nextFollowUpDate || '9999')), [data.sponsors, myId, myMember]);

  const waitingOnOthers = myTasks.filter(({ task }) => task.status === 'Waiting');
  const upNext = [...myTasks, ...myActionItems.map(({ action, meeting }) => ({ task: { ...action, priority: 'Medium' as const }, project: { id: meeting.id, name: meeting.title } as any }))]
    .filter((item: any) => item.task?.dueDate)
    .sort((a: any, b: any) => a.task.dueDate.localeCompare(b.task.dueDate))
    .slice(0, 3);

  const totalOpen = myTasks.length + myLaunches.length + myActionItems.length + myApprovals.length + mySponsors.length;
  const nextDue = [...myTasks.map(({ task }) => task.dueDate), ...myActionItems.map(({ action }) => action.dueDate)].filter(Boolean).sort()[0];

  const emptyAction = myMember ? undefined : <button className="btn-secondary" onClick={() => navigate('/people')}>Open People</button>;

  return (
    <ScreenCanvas variant="standard">
      <CommandHero
        title="Focus"
        description={myMember ? `${myMember.displayName} · ${myMember.role}` : 'Your personal work list.'}
        metrics={[
          { label: 'Open items', value: totalOpen },
          { label: 'Next due', value: nextDue ? formatDateShort(nextDue) : 'Clear' },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
          {myMember ? <PersonToken member={myMember} /> : <span>No linked member profile</span>}
        </div>
      </CommandHero>

      {totalOpen === 0 ? (
        <EmptyMoment
          icon={<CheckCircle2 size={22} />}
          title="You’re clear for now"
          description="New assignments, approvals, and follow-ups will appear here as they land."
          action={emptyAction}
        />
      ) : (
        <div className="space-y-5">
          <WorkQueue title="Up next">
            {upNext.length === 0 ? (
              <EmptyMoment title="No urgent items" description="Nothing immediate is due from your queue." />
            ) : (
              upNext.map((item: any, index) => (
                <WorkQueueRow
                  key={`${item.project.id}-${index}`}
                  title={item.task.title}
                  meta={item.project.name}
                  due={item.task.dueDate ? formatDateShort(item.task.dueDate) : 'No date'}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate(item.project.id.startsWith('mtg') ? '/meetings' : `/projects/${item.project.id}`)}>Open</button>}
                  tone={item.task.dueDate && isOverdue(item.task.dueDate) ? 'critical' : 'accent'}
                />
              ))
            )}
          </WorkQueue>

          <WorkQueue title="Assigned tasks">
            {myTasks.length === 0 ? (
              <EmptyMoment title="No assigned tasks" description="Tasks assigned to you will appear here." />
            ) : (
              myTasks.map(({ task, project }) => (
                <WorkQueueRow
                  key={task.id}
                  title={task.title}
                  meta={project.name}
                  due={task.dueDate ? formatDateShort(task.dueDate) : 'No date'}
                  status={<StatusBadge status={task.status} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate(`/projects/${project.id}`)}>Open</button>}
                  tone={task.dueDate && isOverdue(task.dueDate) ? 'critical' : task.status === 'Waiting' ? 'waiting' : 'accent'}
                />
              ))
            )}
          </WorkQueue>

          <WorkQueue title="Launch work">
            {myLaunches.length === 0 ? (
              <EmptyMoment title="No launch work assigned" description="Launch drafting, review, and caption work will show here." />
            ) : (
              myLaunches.map(({ launch, project }) => (
                <WorkQueueRow
                  key={launch.id}
                  title={launch.title}
                  meta={project.name}
                  due={launch.publishDate ? formatDateShort(launch.publishDate) : 'No date'}
                  status={<StatusBadge status={launch.approvalStatus} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate('/launches')}>Open</button>}
                  tone="launch"
                />
              ))
            )}
          </WorkQueue>

          <WorkQueue title="Meeting actions">
            {myActionItems.length === 0 ? (
              <EmptyMoment title="No meeting actions" description="Action items from meetings will appear here." />
            ) : (
              myActionItems.map(({ action, meeting }) => (
                <WorkQueueRow
                  key={action.id}
                  title={action.title}
                  meta={meeting.title}
                  due={action.dueDate ? formatDateShort(action.dueDate) : 'No date'}
                  status={<StatusBadge status={action.status} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate('/meetings')}>Open</button>}
                  tone={action.dueDate && isOverdue(action.dueDate) ? 'critical' : 'neutral'}
                />
              ))
            )}
          </WorkQueue>

          <WorkQueue title="Approvals">
            {myApprovals.length === 0 ? (
              <EmptyMoment title="No approvals waiting" description="Approvals routed to you will appear here." />
            ) : (
              myApprovals.map((approval) => (
                <WorkQueueRow
                  key={approval.id}
                  title={approval.title}
                  meta={approval.relatedType}
                  due={approval.submittedDate ? formatDateShort(approval.submittedDate) : 'No date'}
                  status={<StatusBadge status={approval.status} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate('/approvals')}>Open</button>}
                  tone="warning"
                />
              ))
            )}
          </WorkQueue>

          <WorkQueue title="Sponsor follow-ups">
            {mySponsors.length === 0 ? (
              <EmptyMoment title="No sponsor follow-ups" description="Assigned sponsor follow-ups will appear here." />
            ) : (
              mySponsors.map((sponsor) => (
                <WorkQueueRow
                  key={sponsor.id}
                  title={sponsor.name}
                  meta={sponsor.packageName}
                  due={sponsor.nextFollowUpDate ? formatDateShort(sponsor.nextFollowUpDate) : 'No date'}
                  status={<StatusBadge status={sponsor.paymentStatus} />}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate('/money')}>Open</button>}
                  tone={sponsor.nextFollowUpDate && isOverdue(sponsor.nextFollowUpDate) ? 'critical' : 'warning'}
                />
              ))
            )}
          </WorkQueue>

          {waitingOnOthers.length > 0 && (
            <WorkQueue title="Waiting on others">
              {waitingOnOthers.map(({ task, project }) => (
                <WorkQueueRow
                  key={task.id}
                  title={task.title}
                  meta={`${project.name} · waiting`}
                  owner={task.assignee ? <PersonToken name={task.assignee} compact /> : <Users size={14} />}
                  due={task.dueDate ? formatDateShort(task.dueDate) : 'No date'}
                  action={<button className="btn-ghost text-xs" onClick={() => navigate(`/projects/${project.id}`)}>Open</button>}
                  tone="waiting"
                />
              ))}
            </WorkQueue>
          )}
        </div>
      )}
    </ScreenCanvas>
  );
}
