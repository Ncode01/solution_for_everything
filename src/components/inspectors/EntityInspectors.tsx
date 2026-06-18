import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Task, Deliverable, PRItem, Sponsor, Member, ApprovalRequest, Meeting,
  TaskStatus, DeliverableStatus, PRApprovalStatus, PRPublishingStatus,
  SponsorStage, PaymentStatus, AppData, Project,
} from '../../types';
import SlideOver from '../SlideOver';
import StatusBadge from '../StatusBadge';
import { formatDate, formatDateShort, formatCurrency } from '../../lib/dateUtils';
import { resolveMemberName } from '../MemberSelect';

// ── Task Inspector ──────────────────────────────────────────────────────────

interface TaskInspectorProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  project?: Project;
  members: Member[];
  onStatusChange?: (status: TaskStatus) => void;
  onEdit?: () => void;
}

export function TaskInspector({ open, onClose, task, project, members, onStatusChange, onEdit }: TaskInspectorProps) {
  if (!task) return null;
  const statuses: TaskStatus[] = ['To Do', 'Doing', 'Waiting', 'Review', 'Approved', 'Done', 'Blocked'];

  return (
    <SlideOver open={open} onClose={onClose} title={task.title} subtitle={project?.name}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <StatusBadge status={task.priority} />
        </div>
        <InfoRow label="Project" value={project?.name ?? '—'} />
        <InfoRow label="Assignee" value={resolveMemberName(task.assigneeId || task.assignee, members, 'Unassigned')} />
        {task.reviewer && <InfoRow label="Reviewer" value={resolveMemberName(task.reviewerId || task.reviewer, members, '—')} />}
        {task.dueDate && <InfoRow label="Due date" value={formatDate(task.dueDate)} />}
        {task.description && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300">{task.description}</p>
          </div>
        )}
        {onStatusChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Quick status</p>
            <select className="select w-full text-sm" value={task.status} onChange={(e) => onStatusChange(e.target.value as TaskStatus)}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit task</button>}
      </div>
    </SlideOver>
  );
}

// ── Deliverable Inspector ─────────────────────────────────────────────────────

interface DeliverableInspectorProps {
  open: boolean;
  onClose: () => void;
  deliverable: Deliverable | null;
  project?: Project;
  members: Member[];
  linkedTasks?: Task[];
  onStatusChange?: (status: DeliverableStatus) => void;
  onEdit?: () => void;
}

export function DeliverableInspector({ open, onClose, deliverable, project, members, linkedTasks, onStatusChange, onEdit }: DeliverableInspectorProps) {
  if (!deliverable) return null;
  const statuses: DeliverableStatus[] = ['Not Started', 'Drafting', 'In Review', 'Changes Requested', 'Approved', 'Published', 'Completed', 'Archived'];

  return (
    <SlideOver open={open} onClose={onClose} title={deliverable.title} subtitle={`${deliverable.type} · ${project?.name ?? ''}`}>
      <div className="space-y-4">
        <StatusBadge status={deliverable.status} />
        <InfoRow label="Project" value={project?.name ?? '—'} />
        <InfoRow label="Owner" value={resolveMemberName(deliverable.ownerId || deliverable.owner, members, 'Unassigned')} />
        {deliverable.dueDate && <InfoRow label="Due date" value={formatDate(deliverable.dueDate)} />}
        {deliverable.description && <InfoRow label="Description" value={deliverable.description} />}
        {linkedTasks && linkedTasks.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Related tasks</p>
            <ul className="space-y-1">{linkedTasks.map((t) => <li key={t.id} className="text-sm text-slate-300">· {t.title}</li>)}</ul>
          </div>
        )}
        {onStatusChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Quick status</p>
            <select className="select w-full text-sm" value={deliverable.status} onChange={(e) => onStatusChange(e.target.value as DeliverableStatus)}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit deliverable</button>}
      </div>
    </SlideOver>
  );
}

// ── Launch Inspector ──────────────────────────────────────────────────────────

interface LaunchInspectorProps {
  open: boolean;
  onClose: () => void;
  item: PRItem | null;
  project?: Project;
  members: Member[];
  onApprovalChange?: (s: PRApprovalStatus) => void;
  onPublishingChange?: (s: PRPublishingStatus) => void;
  onEdit?: () => void;
}

export function LaunchInspector({ open, onClose, item, project, members, onApprovalChange, onPublishingChange, onEdit }: LaunchInspectorProps) {
  const [copied, setCopied] = React.useState(false);
  if (!item) return null;

  function copyCaption() {
    if (!item?.caption) return;
    navigator.clipboard?.writeText(item.caption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <SlideOver open={open} onClose={onClose} title={item.title} subtitle={`${item.platform} · ${project?.name ?? ''}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={item.approvalStatus} />
          <StatusBadge status={item.publishingStatus} />
        </div>
        <InfoRow label="Campaign" value={item.campaign} />
        <InfoRow label="Publish" value={`${formatDate(item.publishDate)} ${item.publishTime}`} />
        <InfoRow label="Designer" value={resolveMemberName(item.designerId || item.designer, members, '—')} />
        <InfoRow label="Caption writer" value={resolveMemberName(item.captionWriterId || item.captionWriter, members, '—')} />
        {item.caption && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Caption</p>
              <button className="text-xs text-blue-400 hover:text-blue-300" onClick={copyCaption}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <p className="text-sm text-slate-300 italic">{item.caption}</p>
          </div>
        )}
        {item.designLink && (
          <a href={item.designLink} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-sm text-center block">
            Open design link
          </a>
        )}
        {onApprovalChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Approval status</p>
            <select className="select w-full text-sm" value={item.approvalStatus} onChange={(e) => onApprovalChange(e.target.value as PRApprovalStatus)}>
              {(['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'] as PRApprovalStatus[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onPublishingChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Publishing status</p>
            <select className="select w-full text-sm" value={item.publishingStatus} onChange={(e) => onPublishingChange(e.target.value as PRPublishingStatus)}>
              {(['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'] as PRPublishingStatus[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit launch item</button>}
      </div>
    </SlideOver>
  );
}

// ── Sponsor Inspector ─────────────────────────────────────────────────────────

interface SponsorInspectorProps {
  open: boolean;
  onClose: () => void;
  sponsor: Sponsor | null;
  project?: Project;
  members: Member[];
  onStageChange?: (s: SponsorStage) => void;
  onPaymentChange?: (s: PaymentStatus) => void;
  onEdit?: () => void;
}

export function SponsorInspector({ open, onClose, sponsor, project, members, onStageChange, onPaymentChange, onEdit }: SponsorInspectorProps) {
  if (!sponsor) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={sponsor.name} subtitle={project?.name}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={sponsor.stage} />
          <StatusBadge status={sponsor.paymentStatus} />
        </div>
        <InfoRow label="Amount" value={formatCurrency(sponsor.amount)} />
        <InfoRow label="Package" value={sponsor.packageName || '—'} />
        <InfoRow label="Assigned" value={resolveMemberName(sponsor.assignedMemberId || sponsor.assignedMember, members, 'Unassigned')} />
        {sponsor.nextFollowUpDate && <InfoRow label="Follow-up" value={formatDate(sponsor.nextFollowUpDate)} />}
        {sponsor.notes && <InfoRow label="Notes" value={sponsor.notes} />}
        {sponsor.deliverables.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Deliverables ({sponsor.deliverables.length})</p>
            <ul className="space-y-1">{sponsor.deliverables.map((d) => (
              <li key={d.id} className="text-sm text-slate-300 flex justify-between gap-2">
                <span>{d.title}</span>
                <StatusBadge status={d.status} />
              </li>
            ))}</ul>
          </div>
        )}
        {onStageChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Stage</p>
            <select className="select w-full text-sm" value={sponsor.stage} onChange={(e) => onStageChange(e.target.value as SponsorStage)}>
              {(['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'] as SponsorStage[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onPaymentChange && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Payment status</p>
            <select className="select w-full text-sm" value={sponsor.paymentStatus} onChange={(e) => onPaymentChange(e.target.value as PaymentStatus)}>
              {(['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'] as PaymentStatus[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit sponsor</button>}
      </div>
    </SlideOver>
  );
}

// ── Person Inspector ──────────────────────────────────────────────────────────

interface PersonInspectorProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  data: AppData;
}

export function PersonInspector({ open, onClose, member, data }: PersonInspectorProps) {
  const navigate = useNavigate();
  if (!member) return null;

  const tasks = data.projects.flatMap((p) => p.tasks.filter((t) => t.assigneeId === member.id || t.assignee === member.displayName).map((t) => ({ ...t, projectName: p.name, projectId: p.id })));
  const launches = data.projects.flatMap((p) => p.prItems.filter((pr) => pr.designerId === member.id || pr.captionWriterId === member.id).map((pr) => ({ ...pr, projectName: p.name })));
  const approvals = data.approvals.filter((a) => a.approver === member.displayName || a.requestedBy === member.displayName);
  const sponsors = data.sponsors.filter((s) => s.assignedMemberId === member.id || s.assignedMember === member.displayName);

  return (
    <SlideOver open={open} onClose={onClose} title={member.displayName} subtitle={`${member.role} · ${member.committee}`}>
      <div className="space-y-5">
        <InfoRow label="Availability" value={member.availabilityStatus} />
        <InfoRow label="Email" value={member.email || '—'} />
        <Section title={`Tasks (${tasks.length})`}>
          {tasks.slice(0, 5).map((t) => (
            <button key={t.id} className="block w-full text-left text-sm text-slate-300 hover:text-white py-1" onClick={() => { navigate(`/projects/${t.projectId}`); onClose(); }}>
              · {t.title} <span className="text-slate-500">— {t.projectName}</span>
            </button>
          ))}
          {tasks.length === 0 && <p className="text-sm text-slate-600">No assigned tasks.</p>}
        </Section>
        <Section title={`Launches (${launches.length})`}>
          {launches.slice(0, 3).map((pr) => <p key={pr.id} className="text-sm text-slate-300">· {pr.title}</p>)}
        </Section>
        <Section title={`Approvals (${approvals.length})`}>
          {approvals.slice(0, 3).map((a) => <p key={a.id} className="text-sm text-slate-300">· {a.title} — {a.status}</p>)}
        </Section>
        <Section title={`Sponsor follow-ups (${sponsors.length})`}>
          {sponsors.slice(0, 3).map((s) => <p key={s.id} className="text-sm text-slate-300">· {s.name} — {s.stage}</p>)}
        </Section>
      </div>
    </SlideOver>
  );
}

// ── Approval Inspector ────────────────────────────────────────────────────────

interface ApprovalInspectorProps {
  open: boolean;
  onClose: () => void;
  approval: ApprovalRequest | null;
  project?: Project;
  onEdit?: () => void;
}

export function ApprovalInspector({ open, onClose, approval, project, onEdit }: ApprovalInspectorProps) {
  if (!approval) return null;
  return (
    <SlideOver open={open} onClose={onClose} title={approval.title} subtitle={project?.name}>
      <div className="space-y-4">
        <StatusBadge status={approval.status} />
        <InfoRow label="Type" value={approval.relatedType} />
        <InfoRow label="Requested by" value={approval.requestedBy} />
        <InfoRow label="Approver" value={approval.approver} />
        <InfoRow label="Submitted" value={formatDate(approval.submittedDate)} />
        {approval.decisionDate && <InfoRow label="Decision" value={formatDate(approval.decisionDate)} />}
        {approval.comments && <InfoRow label="Comments" value={approval.comments} />}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit request</button>}
      </div>
    </SlideOver>
  );
}

// ── Meeting Inspector ─────────────────────────────────────────────────────────

interface MeetingInspectorProps {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  project?: Project;
  onEdit?: () => void;
}

export function MeetingInspector({ open, onClose, meeting, project, onEdit }: MeetingInspectorProps) {
  if (!meeting) return null;
  return (
    <SlideOver open={open} onClose={onClose} title={meeting.title} subtitle={`${meeting.type} · ${formatDateShort(meeting.date)}`}>
      <div className="space-y-4">
        <InfoRow label="Project" value={project?.name ?? 'General'} />
        <InfoRow label="Time" value={meeting.time || '—'} />
        {meeting.location && <InfoRow label="Location" value={meeting.location} />}
        {meeting.decisions.length > 0 && (
          <Section title={`Decisions (${meeting.decisions.length})`}>
            {meeting.decisions.map((d) => <p key={d.id} className="text-sm text-slate-300">· {d.decision}</p>)}
          </Section>
        )}
        {meeting.actionItems.length > 0 && (
          <Section title={`Action items (${meeting.actionItems.length})`}>
            {meeting.actionItems.map((a) => (
              <p key={a.id} className="text-sm text-slate-300 flex justify-between gap-2">
                <span>{a.title}</span>
                <span className="text-slate-500 shrink-0">{a.status}</span>
              </p>
            ))}
          </Section>
        )}
        {onEdit && <button className="btn-secondary w-full text-sm" onClick={onEdit}>Edit meeting</button>}
      </div>
    </SlideOver>
  );
}

// ── Calendar Day Inspector ────────────────────────────────────────────────────

export interface CalendarDayItem {
  id: string;
  label: string;
  type: string;
  projectName: string;
  status?: string;
  extra?: string;
  link: string;
}

interface CalendarDayInspectorProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  items: CalendarDayItem[];
  onItemClick: (item: CalendarDayItem) => void;
}

export function CalendarDayInspector({ open, onClose, date, items, onItemClick }: CalendarDayInspectorProps) {
  if (!date) return null;
  const grouped = items.reduce<Record<string, CalendarDayItem[]>>((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {});

  const dayLabel = new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SlideOver open={open} onClose={onClose} title={dayLabel} subtitle={`${items.length} item${items.length !== 1 ? 's' : ''}`}>
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">No items for this day.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, typeItems]) => (
            <div key={type}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{type}</p>
              <div className="space-y-1.5">
                {typeItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => onItemClick(item)}
                    className="w-full text-left rounded-lg border border-slate-800 px-3 py-2.5 hover:border-slate-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.projectName}{item.extra ? ` · ${item.extra}` : ''}</p>
                    {item.status && <div className="mt-1"><StatusBadge status={item.status} /></div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-1.5">{title}</p>
      {children}
    </div>
  );
}
