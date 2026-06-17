import React, { useState } from 'react';
import { Plus, Handshake, Edit2, Trash2, ExternalLink, FileText } from 'lucide-react';
import { Sponsor, SponsorStage, PaymentStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getSponsorTotals } from '../../lib/stats';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SponsorForm from './SponsorForm';
import { formatDate, formatCurrency, isOverdue } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];
const PAYMENTS: PaymentStatus[] = ['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];

export default function SponsorsPage() {
  const { data, saveSponsor, deleteSponsor } = useAppData();
  const { sponsors, projects } = data;
  const [projectFilter, setProjectFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState<SponsorStage | 'All'>('All');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'All'>('All');
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<Sponsor | null>(null);

  useAutoNew(() => setFormModal({ open: true }));

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '—';

  const filtered = sponsors.filter((s) =>
    (projectFilter === 'All' || s.projectId === projectFilter) &&
    (stageFilter === 'All' || s.stage === stageFilter) &&
    (paymentFilter === 'All' || s.paymentStatus === paymentFilter)
  );

  const totals = getSponsorTotals(filtered);

  function quickStage(s: Sponsor, stage: SponsorStage) {
    saveSponsor({ ...s, stage });
  }
  function quickPayment(s: Sponsor, paymentStatus: PaymentStatus) {
    saveSponsor({ ...s, paymentStatus });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Sponsors"
        description="Track outreach, follow-ups, deliverables, and payments."
        actions={<button onClick={() => setFormModal({ open: true })} className="btn-primary"><Plus size={16} /> New Sponsor</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-3"><p className="text-xs text-slate-500">Sponsors</p><p className="text-xl font-bold text-white">{totals.count}</p></Card>
        <Card className="py-3"><p className="text-xs text-slate-500">Confirmed</p><p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.confirmed)}</p></Card>
        <Card className="py-3"><p className="text-xs text-slate-500">Pipeline</p><p className="text-xl font-bold text-amber-400">{formatCurrency(totals.pipeline)}</p></Card>
        <Card className="py-3"><p className="text-xs text-slate-500">Total Target</p><p className="text-xl font-bold text-slate-300">{formatCurrency(totals.total)}</p></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select w-44" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SponsorStage | 'All')}>
          <option value="All">All Stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-44" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'All')}>
          <option value="All">All Payments</option>
          {PAYMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Handshake} title="No sponsors" description="Add sponsor leads to track outreach and payments." action={<button onClick={() => setFormModal({ open: true })} className="btn-primary">Add Sponsor</button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const followOverdue = s.nextFollowUpDate && isOverdue(s.nextFollowUpDate) && s.stage !== 'Confirmed' && s.stage !== 'Completed' && s.stage !== 'Rejected';
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{s.name}</h3>
                      <StatusBadge status={s.stage} />
                      <StatusBadge status={s.paymentStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {projectName(s.projectId)} · {s.packageName || 'No package'} · {formatCurrency(s.amount)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span>Owner: {s.assignedMember || '—'}</span>
                      {s.nextFollowUpDate && (
                        <span className={followOverdue ? 'text-red-400' : ''}>Follow-up: {formatDate(s.nextFollowUpDate)}</span>
                      )}
                      {s.deliverables.length > 0 && <span>{s.deliverables.length} deliverables</span>}
                      {s.proposalLink && <a href={s.proposalLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><FileText size={11} /> Proposal</a>}
                      {s.agreementLink && <a href={s.agreementLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><ExternalLink size={11} /> Agreement</a>}
                    </div>
                    {s.notes && <p className="text-xs text-slate-600 mt-1.5">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <select className="select text-xs py-1 w-36" value={s.stage} onChange={(e) => quickStage(s, e.target.value as SponsorStage)}>
                      {STAGES.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <select className="select text-xs py-1 w-32" value={s.paymentStatus} onChange={(e) => quickPayment(s, e.target.value as PaymentStatus)}>
                      {PAYMENTS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <button className="btn-ghost p-1.5" onClick={() => setFormModal({ open: true, editing: s })}><Edit2 size={13} /></button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel(s)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit Sponsor' : 'New Sponsor'} size="lg">
        <SponsorForm
          initial={formModal.editing}
          projects={projects}
          members={data.members}
          onSave={(s) => { saveSponsor(s); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete sponsor?"
        message={`Delete "${confirmDel?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteSponsor(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
