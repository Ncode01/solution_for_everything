import React, { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Committee, Member, WorkloadLevel } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { useAutoNew } from '../../lib/useAutoNew';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import MemberForm from '../members/MemberForm';
import PersonToken from '../../components/design/PersonToken';
import StatusDot from '../../components/design/StatusDot';
import StatusBadge from '../../components/StatusBadge';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import Matrix from '../../components/layout/Matrix';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';

const COMMITTEES: Committee[] = ['Executive', 'PR & Media', 'Development', 'Sponsorship', 'Finance', 'Logistics', 'Events', 'Editorial', 'Education', 'General'];
const WORKLOADS: WorkloadLevel[] = ['Light', 'Normal', 'Heavy', 'Overloaded'];

export default function PeoplePage() {
  const { data, saveMember, deleteMember } = useAppData();
  const { members, projects, meetings, sponsors } = data;
  const [search, setSearch] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState<Committee | 'All'>('All');
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadLevel | 'All'>('All');
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: Member }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<Member | null>(null);

  useAutoNew(() => setFormModal({ open: true }));

  const filtered = members.filter((member) => {
    const matchSearch = member.displayName.toLowerCase().includes(search.toLowerCase()) || member.role.toLowerCase().includes(search.toLowerCase()) || member.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase()));
    const matchCommittee = committeeFilter === 'All' || member.committee === committeeFilter;
    const matchWorkload = workloadFilter === 'All' || member.workloadLevel === workloadFilter;
    return matchSearch && matchCommittee && matchWorkload;
  });

  const committees = useMemo(() => COMMITTEES.map((committee) => ({
    committee,
    members: filtered.filter((member) => member.committee === committee),
  })).filter((group) => group.members.length > 0), [filtered]);

  const activePeople = members.length;
  const overloaded = members.filter((member) => member.workloadLevel === 'Overloaded').length;
  const available = members.filter((member) => member.availabilityStatus === 'Available' && ['Light', 'Normal'].includes(member.workloadLevel)).length;

  function workloadCounts(member: Member) {
    const tasks = projects.flatMap((project) => project.tasks).filter((task) => ((task.assigneeId && task.assigneeId === member.id) || (!task.assigneeId && task.assignee === member.displayName)) && task.status !== 'Done' && task.status !== 'Approved').length;
    const launches = projects.flatMap((project) => project.prItems).filter((launch) => [launch.designerId, launch.captionWriterId, launch.reviewerId].includes(member.id) || [launch.designer, launch.captionWriter, launch.reviewer].includes(member.displayName)).length;
    const meetingActions = meetings.flatMap((meeting) => meeting.actionItems).filter((action) => ((action.ownerId && action.ownerId === member.id) || (!action.ownerId && action.owner === member.displayName)) && action.status !== 'Done' && action.status !== 'Cancelled').length;
    const sponsorFollowUps = sponsors.filter((sponsor) => ((sponsor.assignedMemberId && sponsor.assignedMemberId === member.id) || (!sponsor.assignedMemberId && sponsor.assignedMember === member.displayName)) && sponsor.stage !== 'Completed' && sponsor.stage !== 'Rejected').length;
    const approvals = data.approvals.filter((approval) => ((approval.approverId && approval.approverId === member.id) || (!approval.approverId && approval.approver === member.displayName)) && approval.status !== 'Approved' && approval.status !== 'Rejected').length;
    return { tasks, launches, meetingActions, sponsorFollowUps, approvals };
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="People"
        description="Committee map, workload balance, and who has capacity."
        primaryAction={<button className="btn-primary" onClick={() => setFormModal({ open: true })}><Plus size={16} /> Add Person</button>}
        metrics={[
          { label: 'Active People', value: activePeople },
          { label: 'Committees', value: committees.length },
          { label: 'Overloaded', value: overloaded, tone: overloaded > 0 ? 'danger' : 'default' },
          { label: 'Available', value: available, tone: 'success' },
        ]}
      />

      <ContextActionBar>
        <div className="relative min-w-[15rem] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Search people..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-40" value={committeeFilter} onChange={(e) => setCommitteeFilter(e.target.value as Committee | 'All')}>
          <option value="All">All committees</option>
          {COMMITTEES.map((committee) => <option key={committee}>{committee}</option>)}
        </select>
        <select className="select w-40" value={workloadFilter} onChange={(e) => setWorkloadFilter(e.target.value as WorkloadLevel | 'All')}>
          <option value="All">All workloads</option>
          {WORKLOADS.map((workload) => <option key={workload}>{workload}</option>)}
        </select>
      </ContextActionBar>

      {filtered.length === 0 ? (
        <EmptyMoment icon={<Users size={20} />} title="No people found" description="Add members so work can be assigned properly." action={<button className="btn-primary" onClick={() => setFormModal({ open: true })}>Add person</button>} />
      ) : (
        <>
          <section className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Committee map</div>
            <div className="grid gap-4 xl:grid-cols-2">
              {committees.map((group) => (
                <Card key={group.committee} className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{group.committee}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{group.members.length} people</div>
                  </div>
                  <div className="space-y-3">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-3">
                        <PersonToken member={member} />
                        <div className="flex items-center gap-2">
                          <StatusBadge status={member.availabilityStatus} />
                          <StatusDot label={member.workloadLevel} tone={member.workloadLevel === 'Overloaded' ? 'red' : member.workloadLevel === 'Heavy' ? 'amber' : member.workloadLevel === 'Normal' ? 'emerald' : 'blue'} lozenge />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Workload matrix</div>
            <Matrix
              columns={['Member', 'Tasks', 'Launches', 'Meetings', 'Sponsor Follow-ups', 'Approvals']}
              rows={filtered.map((member) => {
                const counts = workloadCounts(member);
                return (
                  <div key={member.id} className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(84px,1fr))] gap-3 border-b border-[var(--border-hairline)] px-4 py-3 last:border-b-0 md:px-5">
                    <div className="min-w-0">
                      <PersonToken member={member} />
                    </div>
                    <div><StatusDot label={String(counts.tasks)} tone={counts.tasks > 4 ? 'amber' : 'neutral'} lozenge /></div>
                    <div><StatusDot label={String(counts.launches)} tone={counts.launches > 2 ? 'amber' : 'neutral'} lozenge /></div>
                    <div><StatusDot label={String(counts.meetingActions)} tone={counts.meetingActions > 2 ? 'amber' : 'neutral'} lozenge /></div>
                    <div><StatusDot label={String(counts.sponsorFollowUps)} tone={counts.sponsorFollowUps > 2 ? 'amber' : 'neutral'} lozenge /></div>
                    <div><StatusDot label={String(counts.approvals)} tone={counts.approvals > 0 ? 'blue' : 'neutral'} lozenge /></div>
                  </div>
                );
              })}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">Skills rail</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {filtered.flatMap((member) => member.skills).slice(0, 18).map((skill, index) => (
                  <span key={`${skill}-${index}`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{skill}</span>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">Availability rail</div>
              <div className="mt-3 space-y-2">
                {filtered.slice(0, 6).map((member) => (
                  <div key={`availability-${member.id}`} className="flex items-center justify-between gap-3">
                    <PersonToken member={member} compact />
                    <StatusBadge status={member.availabilityStatus} />
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}

      {formModal.open && (
        <Modal open={formModal.open} title={formModal.editing ? 'Edit Person' : 'Add Person'} onClose={() => setFormModal({ open: false })} size="lg">
          <MemberForm initial={formModal.editing} projects={projects} onSave={(member) => { saveMember(member); setFormModal({ open: false }); }} onCancel={() => setFormModal({ open: false })} />
        </Modal>
      )}

      <ConfirmDialog open={!!confirmDel} title="Remove person?" message={`Remove ${confirmDel?.displayName} from People?`} onConfirm={() => { if (confirmDel) deleteMember(confirmDel.id); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />
    </ScreenCanvas>
  );
}
