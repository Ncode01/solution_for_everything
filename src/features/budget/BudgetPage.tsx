import React, { useState } from 'react';
import {
  Plus, Wallet, Edit2, Trash2, ExternalLink, AlertTriangle, Settings2,
  Handshake, FileText, TrendingUp, TrendingDown, Download,
} from 'lucide-react';
import { Transaction, TransactionType, Sponsor, SponsorStage, PaymentStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getBudgetSummary, getSponsorTotals } from '../../lib/stats';
import { resolveMemberName } from '../../components/MemberSelect';
import { toCSV, downloadCSV } from '../../lib/csvExport';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import ProgressBar from '../../components/ProgressBar';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import SponsorForm from '../sponsors/SponsorForm';
import { formatDate, formatCurrency, isOverdue } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import SegmentedControl from '../../components/design/SegmentedControl';

type FinanceTab = 'overview' | 'transactions' | 'sponsors';

function SummaryRow({ label, value, tone = 'text-slate-200' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${tone}`}>{value}</span>
    </div>
  );
}

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];
const PAYMENTS: PaymentStatus[] = ['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];

export default function BudgetPage() {
  const { data, saveTransaction, deleteTransaction, saveBudget, saveSponsor, deleteSponsor } = useAppData();
  const { projects, transactions, budgets, sponsors } = data;

  const [projectFilter, setProjectFilter] = useState(projects[0]?.id ?? '');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>('All');
  const [stageFilter, setStageFilter] = useState<SponsorStage | 'All'>('All');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'All'>('All');
  const [financeTab, setFinanceTab] = useState<FinanceTab>('overview');
  const [txnModal, setTxnModal] = useState<{ open: boolean; editing?: Transaction }>({ open: false });
  const [budgetModal, setBudgetModal] = useState(false);
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [confirmDelTxn, setConfirmDelTxn] = useState<Transaction | null>(null);
  const [confirmDelSponsor, setConfirmDelSponsor] = useState<Sponsor | null>(null);

  useAutoNew(() => setTxnModal({ open: true }));

  const project = projects.find((p) => p.id === projectFilter);
  const summary = project ? getBudgetSummary(data, project.id) : null;
  const budget = budgets.find((b) => b.projectId === projectFilter);

  const projectTxns = transactions
    .filter((t) => t.projectId === projectFilter && (typeFilter === 'All' || t.type === typeFilter))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const projectSponsors = sponsors.filter((s) =>
    (projectFilter === 'All' || s.projectId === projectFilter) &&
    (stageFilter === 'All' || s.stage === stageFilter) &&
    (paymentFilter === 'All' || s.paymentStatus === paymentFilter)
  );

  const sponsorTotals = getSponsorTotals(projectSponsors);

  const allProjectTxns = transactions.filter((t) => t.projectId === projectFilter);
  const allProjectSponsors = sponsors.filter((s) => s.projectId === projectFilter);

  const warnings: string[] = [];
  if (summary) {
    if (summary.actualExpense > summary.expectedExpense && summary.expectedExpense > 0)
      warnings.push('Recorded expenses exceed the expected expense budget.');
    if (summary.confirmedIncome < summary.expectedIncome && summary.expectedIncome > 0)
      warnings.push('Confirmed income is below the expected income target.');
    if (summary.missingReceipts > 0)
      warnings.push(`${summary.missingReceipts} expense${summary.missingReceipts > 1 ? 's are' : ' is'} missing a receipt link.`);
  }

  const overdueFollowUps = allProjectSponsors.filter(
    (s) => s.nextFollowUpDate && isOverdue(s.nextFollowUpDate) && s.stage !== 'Confirmed' && s.stage !== 'Completed' && s.stage !== 'Rejected'
  );

  const FINANCE_TABS: { id: FinanceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: `Transactions (${allProjectTxns.length})` },
    { id: 'sponsors', label: `Sponsors (${allProjectSponsors.length})` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Money & Sponsors"
        description="Budget, transactions, sponsor pipeline, and payments — all in one place."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setSponsorModal({ open: true })} className="btn-secondary" disabled={!project}><Handshake size={15} /> New Sponsor</button>
            <button onClick={() => setTxnModal({ open: true })} className="btn-primary" disabled={!project}><Plus size={16} /> New Transaction</button>
          </div>
        }
      />

      {/* Project selector */}
      <div className="floating-control p-2 inline-flex max-w-full">
        <select className="select w-72 max-w-full" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!project ? (
        <EmptyState icon={Wallet} title="No project selected" description="Create a project first to track its finances." />
      ) : (
        <>
          {/* Top summary row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Expected Income</p>
              <p className="text-xl font-bold text-slate-200">{formatCurrency(summary!.expectedIncome)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500">Confirmed Income</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(summary!.confirmedIncome)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingDown size={11} /> Expected Expense</p>
              <p className="text-xl font-bold text-slate-200">{formatCurrency(summary!.expectedExpense)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500">Recorded Expense</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(summary!.actualExpense)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500">Surplus / Deficit</p>
              <p className={`text-xl font-bold ${summary!.surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(summary!.surplus)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Handshake size={11} /> Sponsor Pipeline</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(getSponsorTotals(allProjectSponsors).pipeline)}</p>
            </Card>
          </div>

          {/* Warnings */}
          {(warnings.length > 0 || overdueFollowUps.length > 0) && (
            <Card className="border-amber-900/40">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <ul className="text-sm text-amber-300/90 space-y-1">
                  {warnings.map((w) => <li key={w}>{w}</li>)}
                  {overdueFollowUps.length > 0 && (
                    <li>{overdueFollowUps.length} sponsor follow-up{overdueFollowUps.length > 1 ? 's are' : ' is'} overdue.</li>
                  )}
                </ul>
              </div>
            </Card>
          )}

          {/* Inner tabs */}
          <div className="floating-control p-2 overflow-x-auto">
            <SegmentedControl
              value={financeTab}
              onChange={setFinanceTab}
              options={FINANCE_TABS.map((ft) => ({ value: ft.id, label: ft.label }))}
            />
          </div>

          {/* Overview sub-tab */}
          {financeTab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Budget Plan</h3>
                  <button className="btn-ghost text-xs px-2 py-1" onClick={() => setBudgetModal(true)}><Settings2 size={13} /> Edit</button>
                </div>
                <SummaryRow label="Expected Income" value={formatCurrency(summary!.expectedIncome)} />
                <SummaryRow label="Expected Expense" value={formatCurrency(summary!.expectedExpense)} />
                <SummaryRow label="Confirmed Income" value={formatCurrency(summary!.confirmedIncome)} tone="text-emerald-400" />
                <SummaryRow label="Confirmed Expense" value={formatCurrency(summary!.confirmedExpense)} tone="text-amber-400" />
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-white mb-2">Recorded Transactions</h3>
                <SummaryRow label="Income" value={formatCurrency(summary!.actualIncome)} tone="text-emerald-400" />
                <SummaryRow label="Expense" value={formatCurrency(summary!.actualExpense)} tone="text-red-400" />
                <SummaryRow
                  label="Surplus / Deficit"
                  value={formatCurrency(summary!.surplus)}
                  tone={summary!.surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Budget Usage</span><span>{summary!.usagePct}%</span></div>
                  <ProgressBar value={summary!.usagePct} size="md" />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-white mb-2">Sponsor Summary</h3>
                <SummaryRow label="Total sponsors" value={String(allProjectSponsors.length)} />
                <SummaryRow label="Confirmed" value={formatCurrency(getSponsorTotals(allProjectSponsors).confirmed)} tone="text-emerald-400" />
                <SummaryRow label="Pipeline" value={formatCurrency(getSponsorTotals(allProjectSponsors).pipeline)} tone="text-amber-400" />
                <SummaryRow label="Overdue follow-ups" value={String(overdueFollowUps.length)} tone={overdueFollowUps.length > 0 ? 'text-red-400' : 'text-slate-200'} />
              </Card>
            </div>
          )}

          {/* Transactions sub-tab */}
          {financeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <select className="select w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'All')}>
                  <option value="All">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
                <button className="btn-primary" onClick={() => setTxnModal({ open: true })}><Plus size={15} /> Add Transaction</button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const rows = projectTxns.map((t) => ({
                      Date: t.date,
                      Type: t.type,
                      Category: t.category,
                      Amount: t.amount,
                      'Paid By': resolveMemberName(t.paidById || t.paidBy, data.members),
                      'Approved By': resolveMemberName(t.approvedById || t.approvedBy, data.members),
                      Receipt: t.receiptLink || '',
                      Notes: t.notes || '',
                    }));
                    downloadCSV(toCSV(rows), `transactions-${project?.name ?? 'export'}-${new Date().toISOString().slice(0,10)}.csv`);
                  }}
                  title="Export transactions as CSV"
                >
                  <Download size={14} /> CSV
                </button>
              </div>

              {projectTxns.length === 0 ? (
                <EmptyState icon={Wallet} title="No transactions" description="Add income or expense records for this project." action={<button onClick={() => setTxnModal({ open: true })} className="btn-primary">Add Transaction</button>} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="table-header text-left py-2 pr-4">Category</th>
                        <th className="table-header text-left py-2 pr-4">Type</th>
                        <th className="table-header text-right py-2 pr-4">Amount</th>
                        <th className="table-header text-left py-2 pr-4">Date</th>
                        <th className="table-header text-left py-2 pr-4">Receipt</th>
                        <th className="table-header text-left py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectTxns.map((t) => (
                        <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-2.5 pr-4">
                            <p className="text-white">{t.category}</p>
                            {t.notes && <p className="text-xs text-slate-500">{t.notes}</p>}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={t.type === 'Income' ? 'text-emerald-400' : 'text-red-400'}>{t.type}</span>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-200">{formatCurrency(t.amount)}</td>
                          <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">{formatDate(t.date)}</td>
                          <td className="py-2.5 pr-4">
                            {t.receiptLink ? (
                              <a href={t.receiptLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><ExternalLink size={12} /> Open</a>
                            ) : t.type === 'Expense' ? (
                              <span className="text-amber-400 text-xs">Missing</span>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1">
                              <button className="btn-ghost p-1.5" onClick={() => setTxnModal({ open: true, editing: t })}><Edit2 size={13} /></button>
                              <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDelTxn(t)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sponsors sub-tab */}
          {financeTab === 'sponsors' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  <select className="select w-44" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SponsorStage | 'All')}>
                    <option value="All">All Stages</option>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select className="select w-44" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'All')}>
                    <option value="All">All Payments</option>
                    {PAYMENTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={() => setSponsorModal({ open: true })}><Plus size={15} /> Add Sponsor</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="py-3"><p className="text-xs text-slate-500">Sponsors</p><p className="text-xl font-bold text-white">{sponsorTotals.count}</p></Card>
                <Card className="py-3"><p className="text-xs text-slate-500">Confirmed</p><p className="text-xl font-bold text-emerald-400">{formatCurrency(sponsorTotals.confirmed)}</p></Card>
                <Card className="py-3"><p className="text-xs text-slate-500">Pipeline</p><p className="text-xl font-bold text-amber-400">{formatCurrency(sponsorTotals.pipeline)}</p></Card>
                <Card className="py-3"><p className="text-xs text-slate-500">Total Target</p><p className="text-xl font-bold text-slate-300">{formatCurrency(sponsorTotals.total)}</p></Card>
              </div>

              {projectSponsors.length === 0 ? (
                <EmptyState icon={Handshake} title="No sponsors" description="Add sponsor leads to track outreach and payments." action={<button onClick={() => setSponsorModal({ open: true })} className="btn-primary">Add Sponsor</button>} />
              ) : (
                <div className="space-y-3">
                  {projectSponsors.map((s) => {
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
                              {s.packageName || 'No package'} · {formatCurrency(s.amount)} · {s.assignedMember || 'Unassigned'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                              {s.nextFollowUpDate && (
                                <span className={followOverdue ? 'text-red-400' : ''}>Follow-up: {formatDate(s.nextFollowUpDate)}</span>
                              )}
                              {s.deliverables.length > 0 && <span>{s.deliverables.length} deliverable{s.deliverables.length !== 1 ? 's' : ''}</span>}
                              {s.proposalLink && <a href={s.proposalLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><FileText size={11} /> Proposal</a>}
                              {s.agreementLink && <a href={s.agreementLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><ExternalLink size={11} /> Agreement</a>}
                            </div>
                            {s.notes && <p className="text-xs text-slate-600 mt-1.5">{s.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <select className="select text-xs py-1 w-36" value={s.stage} onChange={(e) => saveSponsor({ ...s, stage: e.target.value as SponsorStage })}>
                              {STAGES.map((x) => <option key={x}>{x}</option>)}
                            </select>
                            <select className="select text-xs py-1 w-32" value={s.paymentStatus} onChange={(e) => saveSponsor({ ...s, paymentStatus: e.target.value as PaymentStatus })}>
                              {PAYMENTS.map((x) => <option key={x}>{x}</option>)}
                            </select>
                            <button className="btn-ghost p-1.5" onClick={() => setSponsorModal({ open: true, editing: s })}><Edit2 size={13} /></button>
                            <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDelSponsor(s)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <Modal open={txnModal.open} onClose={() => setTxnModal({ open: false })} title={txnModal.editing ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <TransactionForm
          initial={txnModal.editing}
          projects={projects}
          members={data.members}
          lockedProjectId={txnModal.editing ? undefined : projectFilter}
          onSave={(t) => { saveTransaction(t); setTxnModal({ open: false }); }}
          onCancel={() => setTxnModal({ open: false })}
        />
      </Modal>

      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Edit Budget Plan">
        {project && (
          <BudgetForm
            projectId={project.id}
            initial={budget}
            onSave={(b) => { saveBudget(b); setBudgetModal(false); }}
            onCancel={() => setBudgetModal(false)}
          />
        )}
      </Modal>

      <Modal open={sponsorModal.open} onClose={() => setSponsorModal({ open: false })} title={sponsorModal.editing ? 'Edit Sponsor' : 'New Sponsor'} size="lg">
        <SponsorForm
          initial={sponsorModal.editing}
          projects={projects}
          members={data.members}
          lockedProjectId={projectFilter}
          onSave={(s) => { saveSponsor(s); setSponsorModal({ open: false }); }}
          onCancel={() => setSponsorModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelTxn}
        title="Delete transaction?"
        message={`Delete this ${confirmDelTxn?.type.toLowerCase()} record of ${confirmDelTxn ? formatCurrency(confirmDelTxn.amount) : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelTxn) deleteTransaction(confirmDelTxn.id); setConfirmDelTxn(null); }}
        onCancel={() => setConfirmDelTxn(null)}
      />

      <ConfirmDialog
        open={!!confirmDelSponsor}
        title="Delete sponsor?"
        message={`Delete "${confirmDelSponsor?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelSponsor) deleteSponsor(confirmDelSponsor.id); setConfirmDelSponsor(null); }}
        onCancel={() => setConfirmDelSponsor(null)}
      />
    </div>
  );
}
