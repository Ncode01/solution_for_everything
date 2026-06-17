import React, { useState } from 'react';
import { Plus, Search, Users, Edit2, Trash2, Mail, Phone, GraduationCap } from 'lucide-react';
import { Member, Committee, WorkloadLevel } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import MemberForm from './MemberForm';
import { useAutoNew } from '../../lib/useAutoNew';

const COMMITTEES: Committee[] = [
  'Executive', 'PR & Media', 'Development', 'Sponsorship', 'Finance',
  'Logistics', 'Events', 'Editorial', 'Education', 'General',
];
const WORKLOADS: WorkloadLevel[] = ['Light', 'Normal', 'Heavy', 'Overloaded'];

export default function MembersPage() {
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
    return projects.flatMap((p) => p.tasks).filter((t) => t.assignee === m.name && t.status !== 'Done' && t.status !== 'Approved');
  }
  function actionItemsFor(m: Member) {
    return meetings.flatMap((mt) => mt.actionItems).filter((a) => a.owner === m.name && a.status !== 'Done' && a.status !== 'Cancelled');
  }
  function sponsorFollowUpsFor(m: Member) {
    return sponsors.filter((s) => s.assignedMember === m.name && s.nextFollowUpDate && s.stage !== 'Completed' && s.stage !== 'Rejected');
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Members"
        description="Track who's on the team, their committee, skills, and workload."
        actions={
          <button onClick={() => setFormModal({ open: true })} className="btn-primary">
            <Plus size={16} /> New Member
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, role, skill..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={committeeFilter} onChange={(e) => setCommitteeFilter(e.target.value as Committee | 'All')}>
          <option value="All">All Committees</option>
          {COMMITTEES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="select w-36" value={workloadFilter} onChange={(e) => setWorkloadFilter(e.target.value as WorkloadLevel | 'All')}>
          <option value="All">All Workload</option>
          {WORKLOADS.map((w) => <option key={w}>{w}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Add members so work can be shared across the team." action={<button onClick={() => setFormModal({ open: true })} className="btn-primary">Add Member</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const openTasks = tasksFor(m).length;
            const openActions = actionItemsFor(m).length;
            return (
              <Card key={m.id} onClick={() => setDetail(m)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.role || 'Member'}</p>
                    </div>
                  </div>
                  <StatusBadge status={m.workloadLevel} />
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={m.committee} />
                  <StatusBadge status={m.availabilityStatus} />
                </div>
                {m.skills.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2 truncate">{m.skills.join(' · ')}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                  <span>{m.activeProjectIds.length} projects</span>
                  <span className={openTasks > 0 ? 'text-amber-400' : ''}>{openTasks} open tasks</span>
                  {openActions > 0 && <span className="text-amber-400">{openActions} actions</span>}
                {sponsorFollowUpsFor(m).length > 0 && <span className="text-orange-400">{sponsorFollowUpsFor(m).length} follow-ups</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit Member' : 'New Member'} size="lg">
        <MemberForm
          initial={formModal.editing}
          projects={projects}
          onSave={(m) => { saveMember(m); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={detail.committee} />
              <StatusBadge status={detail.workloadLevel} />
              <StatusBadge status={detail.availabilityStatus} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Role</p><p className="text-slate-200">{detail.role || '—'}</p></div>
              <div><p className="text-xs text-slate-500 flex items-center gap-1"><GraduationCap size={11} /> Grade</p><p className="text-slate-200">{detail.gradeOrClass || '—'}</p></div>
              {detail.email && <div><p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} /> Email</p><p className="text-slate-200 truncate">{detail.email}</p></div>}
              {detail.phone && <div><p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> Phone</p><p className="text-slate-200">{detail.phone}</p></div>}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.skills.length ? detail.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">{s}</span>
                )) : <span className="text-sm text-slate-500">None listed</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Active Projects</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.activeProjectIds.length ? detail.activeProjectIds.map((id) => (
                  <span key={id} className="text-xs px-2 py-0.5 rounded-md bg-blue-600/15 text-blue-300 border border-blue-600/30">
                    {projects.find((p) => p.id === id)?.name ?? id}
                  </span>
                )) : <span className="text-sm text-slate-500">None assigned</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="card py-2.5 text-center">
                <p className="text-lg font-bold text-amber-400">{tasksFor(detail).length}</p>
                <p className="text-xs text-slate-500">Open tasks</p>
              </div>
              <div className="card py-2.5 text-center">
                <p className="text-lg font-bold text-blue-400">{actionItemsFor(detail).length}</p>
                <p className="text-xs text-slate-500">Action items</p>
              </div>
              <div className="card py-2.5 text-center">
                <p className="text-lg font-bold text-orange-400">{sponsorFollowUpsFor(detail).length}</p>
                <p className="text-xs text-slate-500">Sponsor follow-ups</p>
              </div>
            </div>
            {detail.notes && <p className="text-sm text-slate-400 border-t border-slate-800 pt-3">{detail.notes}</p>}
            <div className="flex gap-2 justify-end border-t border-slate-800 pt-3">
              <button className="btn-secondary" onClick={() => { setFormModal({ open: true, editing: detail }); setDetail(null); }}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="btn-danger" onClick={() => { setConfirmDel(detail); setDetail(null); }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete member?"
        message={`Remove ${confirmDel?.name} from the member list? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteMember(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
