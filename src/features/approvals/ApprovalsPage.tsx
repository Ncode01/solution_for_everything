import React, { useState } from 'react';
import { Plus, CheckSquare, Edit2, Trash2 } from 'lucide-react';
import { ApprovalRequest, ApprovalStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ApprovalForm from './ApprovalForm';
import { formatDate, todayISO } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';

const STATUSES: ApprovalStatus[] = ['Draft', 'Submitted', 'Changes Requested', 'Approved', 'Rejected'];

export default function ApprovalsPage() {
  const { data, saveApproval, deleteApproval } = useAppData();
  const { approvals, projects } = data;
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'All'>('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: ApprovalRequest }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<ApprovalRequest | null>(null);

  useAutoNew(() => setFormModal({ open: true }));

  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name ?? '—' : 'General');

  const filtered = approvals
    .filter((a) => (statusFilter === 'All' || a.status === statusFilter) && (projectFilter === 'All' || a.projectId === projectFilter))
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

  function quickStatus(a: ApprovalRequest, status: ApprovalStatus) {
    const decided = status === 'Approved' || status === 'Rejected';
    saveApproval({ ...a, status, decisionDate: decided ? (a.decisionDate ?? todayISO()) : undefined });
  }

  const pending = approvals.filter((a) => a.status === 'Submitted').length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Approvals"
        description={`Track sign-off for posters, budgets, sponsors, and agendas. ${pending} pending.`}
        actions={<button onClick={() => setFormModal({ open: true })} className="btn-primary"><Plus size={16} /> New Request</button>}
      />

      <div className="flex flex-wrap gap-3">
        <select className="select w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'All')}>
          <option value="All">All Status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No approval requests" description="Create a request when something needs sign-off." action={<button onClick={() => setFormModal({ open: true })} className="btn-primary">New Request</button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                    <StatusBadge status={a.status} />
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{a.relatedType}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{projectName(a.projectId)} · Requested by {a.requestedBy || '—'} · Approver {a.approver || '—'}</p>
                  {a.description && <p className="text-sm text-slate-400 mt-1.5">{a.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                    <span>Submitted {formatDate(a.submittedDate)}</span>
                    {a.decisionDate && <span>Decided {formatDate(a.decisionDate)}</span>}
                  </div>
                  {a.comments && <p className="text-xs text-slate-600 mt-1.5 italic">“{a.comments}”</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <select className="select text-xs py-1 w-40" value={a.status} onChange={(e) => quickStatus(a, e.target.value as ApprovalStatus)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="btn-ghost p-1.5" onClick={() => setFormModal({ open: true, editing: a })}><Edit2 size={13} /></button>
                  <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel(a)}><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit Request' : 'New Approval Request'} size="lg">
        <ApprovalForm
          initial={formModal.editing}
          projects={projects}
          members={data.members}
          onSave={(a) => { saveApproval(a); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete approval request?"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteApproval(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
