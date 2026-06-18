import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, User } from 'lucide-react';
import { User as AppUser } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { formatDateShort, isOverdue } from '../../lib/dateUtils';
import { memberMatchesPersonField, resolveMemberForUser } from '../../lib/people';
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

type FocusItem = {
  id: string;
  title: string;
  meta: string;
  due?: string;
  tone: 'accent' | 'critical' | 'warning' | 'waiting' | 'launch' | 'neutral';
  tag: string;
  status?: string;
  openLabel: string;
  onOpen: () => void;
  sortDate: string;
};

export default function FocusPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();

  const myMember = useMemo(() => resolveMemberForUser(user, data.members), [data.members, user]);

  const queue = useMemo<FocusItem[]>(() => {
    if (!myMember) return [];

    const taskItems = data.projects.flatMap((project) =>
      project.tasks
        .filter((task) => memberMatchesPersonField(myMember as never, task.assigneeId, task.assignee) && !['Done', 'Approved'].includes(task.status))
        .map((task) => ({
          id: `task-${task.id}`,
          title: task.title,
          meta: project.name,
          due: task.dueDate,
          tone: task.dueDate && isOverdue(task.dueDate) ? 'critical' as const : task.status === 'Waiting' ? 'waiting' as const : 'accent' as const,
          tag: 'Task',
          status: task.status,
          openLabel: 'Open Project',
          onOpen: () => navigate(`/projects/${project.id}`),
          sortDate: task.dueDate || '9999-12-31',
        }))
    );

    const launchItems = data.projects.flatMap((project) =>
      project.prItems
        .filter((launch) => {
          if (['Archived', 'Posted'].includes(launch.workflowStatus ?? '') || ['Archived', 'Posted'].includes(launch.publishingStatus)) return false;
          return (
            memberMatchesPersonField(myMember as never, launch.designerId, launch.designer) ||
            memberMatchesPersonField(myMember as never, launch.captionWriterId, launch.captionWriter) ||
            memberMatchesPersonField(myMember as never, launch.reviewerId, launch.reviewer)
          );
        })
        .map((launch) => ({
          id: `launch-${launch.id}`,
          title: launch.title,
          meta: project.name,
          due: launch.publishDate,
          tone: 'launch' as const,
          tag: 'Launch',
          status: launch.workflowStatus || launch.approvalStatus,
          openLabel: 'Open Launches',
          onOpen: () => navigate('/launches'),
          sortDate: launch.publishDate || '9999-12-31',
        }))
    );

    const meetingItems = data.meetings.flatMap((meeting) =>
      meeting.actionItems
        .filter((action) => memberMatchesPersonField(myMember as never, action.ownerId, action.owner) && !['Done', 'Cancelled'].includes(action.status))
        .map((action) => ({
          id: `meeting-${action.id}`,
          title: action.title,
          meta: meeting.title,
          due: action.dueDate,
          tone: action.dueDate && isOverdue(action.dueDate) ? 'critical' as const : 'neutral' as const,
          tag: 'Meeting',
          status: action.status,
          openLabel: 'Open Meetings',
          onOpen: () => navigate('/meetings'),
          sortDate: action.dueDate || '9999-12-31',
        }))
    );

    const approvalItems = data.approvals
      .filter((approval) => {
        const ownsApproval = memberMatchesPersonField(myMember as never, approval.approverId, approval.approver);
        const ownsPendingStage = (approval.stages ?? []).some((stage) =>
          memberMatchesPersonField(myMember as never, stage.ownerId, stage.owner) &&
          !['Approved', 'Skipped'].includes(stage.status)
        );
        return (ownsApproval || ownsPendingStage) && !['Approved', 'Rejected'].includes(approval.status);
      })
      .map((approval) => ({
        id: `approval-${approval.id}`,
        title: approval.title,
        meta: approval.relatedType,
        due: approval.submittedDate,
        tone: 'warning' as const,
        tag: 'Approval',
        status: approval.status,
        openLabel: 'Open Approvals',
        onOpen: () => navigate('/approvals'),
        sortDate: approval.submittedDate || '9999-12-31',
      }));

    const sponsorItems = data.sponsors
      .filter((sponsor) =>
        memberMatchesPersonField(myMember as never, sponsor.assignedMemberId, sponsor.assignedMember) &&
        !['Completed', 'Rejected'].includes(sponsor.stage)
      )
      .map((sponsor) => ({
        id: `sponsor-${sponsor.id}`,
        title: sponsor.name,
        meta: sponsor.packageName,
        due: sponsor.nextFollowUpDate,
        tone: sponsor.nextFollowUpDate && isOverdue(sponsor.nextFollowUpDate) ? 'critical' as const : 'warning' as const,
        tag: 'Sponsor',
        status: sponsor.paymentStatus,
        openLabel: 'Open Money',
        onOpen: () => navigate('/money'),
        sortDate: sponsor.nextFollowUpDate || '9999-12-31',
      }));

    return [...taskItems, ...launchItems, ...meetingItems, ...approvalItems, ...sponsorItems]
      .sort((a, b) => a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title));
  }, [data.approvals, data.meetings, data.projects, data.sponsors, myMember, navigate]);

  const nextDue = queue.find((item) => item.due)?.due;

  if (!myMember) {
    return (
      <ScreenCanvas variant="standard">
        <CommandHero
          title="Focus"
          description="No people profile is linked to this login."
          metrics={[{ label: 'Open items', value: 0 }, { label: 'Profile', value: 'Not linked', tone: 'warning' }]}
        >
          <div className="text-sm text-[var(--text-tertiary)]">Link this login to a person by setting <code>username</code> or <code>authUserId</code> on a People profile.</div>
        </CommandHero>
        <EmptyMoment
          icon={<User size={22} />}
          title="No linked people profile"
          description="This login is not mapped to a person yet, so RCCS OS cannot show a real personal queue."
          action={<button className="btn-secondary" onClick={() => navigate('/people')}>Open People</button>}
        />
      </ScreenCanvas>
    );
  }

  return (
    <ScreenCanvas variant="standard">
      <CommandHero
        title="Focus"
        description={`${myMember.displayName} · ${myMember.role}`}
        metrics={[
          { label: 'Open items', value: queue.length },
          { label: 'Next due', value: nextDue ? formatDateShort(nextDue) : 'Clear' },
        ]}
      >
        <PersonToken member={myMember} />
      </CommandHero>

      {queue.length === 0 ? (
        <EmptyMoment
          icon={<CheckCircle2 size={22} />}
          title="You're clear for now"
          description="New assignments, approvals, launch work, and sponsor follow-ups will land here in one queue."
        />
      ) : (
        <WorkQueue title="My queue">
          {queue.map((item) => (
            <WorkQueueRow
              key={item.id}
              title={item.title}
              meta={item.meta}
              due={item.due ? formatDateShort(item.due) : 'No date'}
              status={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    {item.tag}
                  </span>
                  {item.status ? <StatusBadge status={item.status} /> : null}
                </div>
              }
              action={<button className="btn-ghost text-xs" onClick={item.onOpen}>{item.openLabel}</button>}
              tone={item.tone}
            />
          ))}
        </WorkQueue>
      )}
    </ScreenCanvas>
  );
}
