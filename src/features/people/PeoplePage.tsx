/**
 * PeoplePage — renamed from Members (Phase Six).
 * Full members management with workload and skills visibility.
 */
import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, Edit2, Trash2, Mail, Phone, GraduationCap, TrendingUp } from 'lucide-react';
import { Member, Committee, WorkloadLevel } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import MemberForm from '../members/MemberForm';
import { useAutoNew } from '../../lib/useAutoNew';
import PersonToken from '../../components/design/PersonToken';

const COMMITTEES: Committee[] = [
  'Executive', 'PR & Media', 'Development', 'Sponsorship', 'Finance',
  'Logistics', 'Events', 'Editorial', 'Education', 'General',
];
const WORKLOADS: WorkloadLevel[] = ['Light', 'Normal', 'Heavy', 'Overloaded'];

const WORKLOAD_COLOR: Record<WorkloadLevel, string> = {
  Light:     'text-emerald-400',
  Normal:    'text-blue-400',
  Heavy:     'text-amber-400',
  Overloaded:'text-red-400',
};

export default function PeoplePage() {
  const { data, saveMember, deleteMember } = useAppData();
  const { members, projects, meetings, sponsors } = data;
  const [search, setSearch] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState<Committee | 'All'>('All');
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadLevel | 'All'>('All');
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: Member }>({ open: false });
  const [detail, setDetail] = useState<Member | null>(null);
  const [confirmDel, setConfirmDel] = useState<Member | null>(null);

  useAutoNew(() => setFormModal({ open: true }));

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchCommittee = committeeFilter === 'All' || m.committee === committeeFilter;
    const matchWorkload = workloadFilter === 'All' || m.workloadLevel === workloadFilter;
    return matchSearch && matchCommittee && matchWorkload;
  });

  function tasksFor(m: Member) {
    return projects.flatMap((p) => p.tasks).filter((t) =>
      (t.assigneeId && t.assigneeId === m.id) || (!t.assigneeId && t.assignee === m.displayName)
    ).filter((t) => t.status !== 'Done' && t.status !== 'Approved');
  }
  function actionItemsFor(m: Member) {
    return meetings.flatMap((mt) => mt.actionItems).filter((a) =>
      (a.ownerId && a.ownerId === m.id) || (!a.ownerId && a.owner === m.displayName)
    ).filter((a) => a.status !== 'Done' && a.status !== 'Cancelled');
  }
  function sponsorFollowUpsFor(m: Member) {
    return sponsors.filter((s) =>
      (s.assignedMemberId && s.assignedMemberId === m.id) || (!s.assignedMemberId && s.assignedMember === m.displayName)
    ).filter((s) => s.stage !== 'Completed' && s.stage !== 'Rejected');
  }

  // People balance
  const overloaded = members.filter((m) => m.workloadLevel === 'Overloaded' || m.workloadLevel === 'Heavy');
  const available = members.filter((m) => m.availabilityStatus === 'Available' && (m.workloadLevel === 'Light' || m.workloadLevel === 'Normal'));
  const committeeGroups = useMemo(() => {
    const g: Record<string, number> = {};
    members.forEach((m) => { g[m.committee] = (g[m.committee] ?? 0) + 1; });
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }, [members]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="People"
        description="Members, committees, skills, workload, and contribution."
        actions={
          <button onClick={() => setFormModal({ open: true })} className="btn-primary">
            <Plus size={16} /> New Member
          </button>
        }
      />

      {/* People Balance */}
      {members.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-white">People Balance</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{members.length}</p>
              <p className="text-xs text-slate-500">Total members</p>
            </div>
            {overloaded.length > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{overloaded.length}</p>
                <p className="text-xs text-slate-500">High workload</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center ml-2">
              {committeeGroups.map(([committee, count]) => (
                <span key={committee} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {committee}: {count}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {members.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Overloaded</h2>
            <div className="flex flex-wrap gap-2">
              {overloaded.length === 0 ? (
                <span className="text-xs text-slate-500">No heavy workload signals right now.</span>
              ) : overloaded.slice(0, 6).map((m) => (
                <button key={m.id} className="control-pill" onClick={() => setDetail(m)}>
                  <PersonToken member={m} compact />
                  <span className="text-xs">{m.displayName}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Available</h2>
            <div className="flex flex-wrap gap-2">
              {available.length === 0 ? (
                <span className="text-xs text-slate-500">No clearly available members in the current data.</span>
              ) : available.slice(0, 6).map((m) => (
                <button key={m.id} className="control-pill" onClick={() => setDetail(m)}>
                  <PersonToken member={m} compact />
                  <span className="text-xs">{m.displayName}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search people…" className="input pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-40 text-sm" value={committeeFilter} onChange={(e) => setCommitteeFilter(e.target.value as Committee | 'All')}>
          <option value="All">All Committees</option>
          {COMMITTEES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="select w-36 text-sm" value={workloadFilter} onChange={(e) => setWorkloadFilter(e.target.value as WorkloadLevel | 'All')}>
          <option value="All">All Workloads</option>
          {WORKLOADS.map((w) => <option key={w}>{w}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="No members added yet. Add members so work can be assigned properly."
          action={<button className="btn-primary" onClick={() => setFormModal({ open: true })}>Add First Member</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const openTasks = tasksFor(m);
            const openActions = actionItemsFor(m);
            const followUps = sponsorFollowUpsFor(m);
            const totalOpen = openTasks.length + openActions.length + followUps.length;
            return (
              <Card key={m.id} onClick={() => setDetail(m)} className="cursor-pointer hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PersonToken member={m} />
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="btn-ghost p-1.5" onClick={(e) => { e.stopPropagation(); setFormModal({ open: true, editing: m }); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={(e) => { e.stopPropagation(); setConfirmDel(m); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{m.committee}</span>
                  <StatusBadge status={m.availabilityStatus} />
                  <span className={`text-xs font-medium ${WORKLOAD_COLOR[m.workloadLevel]}`}>{m.workloadLevel}</span>
                </div>

                {m.skills.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2 truncate">{m.skills.slice(0, 3).join(' · ')}</p>
                )}

                {totalOpen > 0 && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    {openTasks.length > 0 && <span>{openTasks.length} task{openTasks.length > 1 ? 's' : ''}</span>}
                    {openActions.length > 0 && <span>{openActions.length} action{openActions.length > 1 ? 's' : ''}</span>}
                    {followUps.length > 0 && <span>{followUps.length} sponsor{followUps.length > 1 ? 's' : ''}</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Member detail modal */}
      {detail && (
        <Modal open={!!detail} title={detail.displayName} onClose={() => setDetail(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-blue-300">
                {detail.displayName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white text-base">{detail.displayName}</p>
                <p className="text-sm text-slate-400">{detail.role} · {detail.committee}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={detail.availabilityStatus} />
                  <span className={`text-xs font-medium ${WORKLOAD_COLOR[detail.workloadLevel]}`}>{detail.workloadLevel}</span>
                </div>
              </div>
            </div>
            {detail.gradeOrClass && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <GraduationCap size={14} /> {detail.gradeOrClass}
              </div>
            )}
            {detail.email && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail size={14} /> {detail.email}
              </div>
            )}
            {detail.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone size={14} /> {detail.phone}
              </div>
            )}
            {detail.skills.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.skills.map((s) => (
                    <span key={s} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {detail.activeProjectIds.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Active Projects</p>
                {detail.activeProjectIds.map((pid) => {
                  const p = projects.find((x) => x.id === pid);
                  return p ? <p key={pid} className="text-xs text-slate-300">· {p.name}</p> : null;
                })}
              </div>
            )}
            {detail.notes && <p className="text-xs text-slate-500 italic">{detail.notes}</p>}
          </div>
        </Modal>
      )}

      {formModal.open && (
        <Modal open={formModal.open} title={formModal.editing ? 'Edit Member' : 'New Member'} onClose={() => setFormModal({ open: false })}>
          <MemberForm
            initial={formModal.editing}
            projects={projects}
            onSave={(m) => { saveMember(m); setFormModal({ open: false }); }}
            onCancel={() => setFormModal({ open: false })}
          />
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          open={!!confirmDel}
          title="Remove member?"
          message={`Remove ${confirmDel.displayName} from People? This cannot be undone.`}
          onConfirm={() => { deleteMember(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
