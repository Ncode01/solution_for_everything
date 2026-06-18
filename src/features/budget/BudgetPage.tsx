import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, ExternalLink, Handshake, Plus, Receipt, Search, Wallet } from 'lucide-react';
import { PaymentStatus, Sponsor, SponsorStage, Transaction, TransactionType } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getBudgetSummary, getSponsorTotals } from '../../lib/stats';
import { toCSV, downloadCSV } from '../../lib/csvExport';
import { formatCurrency, formatDate, isOverdue } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import Pipeline from '../../components/layout/Pipeline';
import PipelineLane from '../../components/layout/PipelineLane';
import Ledger from '../../components/layout/Ledger';
import LedgerRow from '../../components/layout/LedgerRow';
import Matrix from '../../components/layout/Matrix';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import SponsorForm from '../sponsors/SponsorForm';
import TransactionForm from './TransactionForm';

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];
const PAYMENTS: PaymentStatus[] = ['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];

export default function BudgetPage() {
  const { data, saveTransaction, deleteTransaction, saveSponsor, deleteSponsor } = useAppData();
  const { projects, sponsors, transactions } = data;
  const [projectFilter, setProjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>('All');
  const [stageFilter, setStageFilter] = useState<SponsorStage | 'All'>('All');
  const [txnModal, setTxnModal] = useState<{ open: boolean; editing?: Transaction }>({ open: false });
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [confirmDelTxn, setConfirmDelTxn] = useState<Transaction | null>(null);
  const [confirmDelSponsor, setConfirmDelSponsor] = useState<Sponsor | null>(null);

  useAutoNew(() => setTxnModal({ open: true }));

  const filteredTransactions = transactions
    .filter((transaction) => (projectFilter === 'All' || transaction.projectId === projectFilter) && (typeFilter === 'All' || transaction.type === typeFilter))
    .sort((a, b) => b.date.localeCompare(a.date));
  const filteredSponsors = sponsors
    .filter((sponsor) => (projectFilter === 'All' || sponsor.projectId === projectFilter) && (stageFilter === 'All' || sponsor.stage === stageFilter));

  const confirmedIncome = filteredTransactions.filter((transaction) => transaction.type === 'Income').reduce((sum, transaction) => sum + transaction.amount, 0);
  const recordedExpense = filteredTransactions.filter((transaction) => transaction.type === 'Expense').reduce((sum, transaction) => sum + transaction.amount, 0);
  const sponsorTotals = getSponsorTotals(filteredSponsors);
  const pendingPipeline = filteredSponsors.filter((sponsor) => !['Confirmed', 'Completed', 'Rejected'].includes(sponsor.stage)).reduce((sum, sponsor) => sum + sponsor.amount, 0);
  const projectMatrix = projects.map((project) => {
    const summary = getBudgetSummary(data, project.id);
    const projectSponsors = sponsors.filter((sponsor) => sponsor.projectId === project.id);
    return {
      project,
      income: summary.confirmedIncome,
      expense: summary.actualExpense,
      surplus: summary.surplus,
      missingReceipts: summary.missingReceipts,
      sponsorStatus: getSponsorTotals(projectSponsors).confirmed,
    };
  });

  const receiptsQueue = filteredTransactions.filter((transaction) => transaction.type === 'Expense' && !transaction.receiptLink);
  const followUpsQueue = filteredSponsors.filter((sponsor) => sponsor.nextFollowUpDate && isOverdue(sponsor.nextFollowUpDate) && sponsor.stage !== 'Confirmed' && sponsor.stage !== 'Completed' && sponsor.stage !== 'Rejected');

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Money"
        description="Sponsors, payments, expenses, receipts, and promises."
        tone="money"
        primaryAction={<button className="btn-primary" onClick={() => setTxnModal({ open: true })}><Plus size={16} /> New Transaction</button>}
        secondaryActions={<button className="btn-secondary" onClick={() => setSponsorModal({ open: true })}><Handshake size={15} /> New Sponsor</button>}
        metrics={[
          { label: 'Confirmed Income', value: formatCurrency(confirmedIncome), tone: 'success' },
          { label: 'Pending Pipeline', value: formatCurrency(pendingPipeline), tone: 'warning' },
          { label: 'Recorded Expense', value: formatCurrency(recordedExpense), tone: 'danger' },
          { label: 'Surplus / Deficit', value: formatCurrency(confirmedIncome - recordedExpense), tone: confirmedIncome - recordedExpense >= 0 ? 'success' : 'danger' },
        ]}
      />

      <ContextActionBar>
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="select w-36" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'All')}>
          <option value="All">All transaction types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <select className="select w-40" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SponsorStage | 'All')}>
          <option value="All">All sponsor stages</option>
          {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
        <button
          className="btn-secondary"
          onClick={() => downloadCSV(toCSV(filteredTransactions.map((transaction) => ({
            Date: transaction.date,
            Project: projects.find((project) => project.id === transaction.projectId)?.name ?? transaction.projectId,
            Category: transaction.category,
            Type: transaction.type,
            Amount: transaction.amount,
            Receipt: transaction.receiptLink || '',
          }))), `money-${new Date().toISOString().slice(0, 10)}.csv`)}
        >
          <Download size={14} /> Export CSV
        </button>
      </ContextActionBar>

      <Pipeline title="Sponsor pipeline">
        {STAGES.filter((stage) => !['Rejected', 'Completed'].includes(stage)).map((stage) => {
          const items = filteredSponsors.filter((sponsor) => sponsor.stage === stage);
          const total = items.reduce((sum, sponsor) => sum + sponsor.amount, 0);
          return (
            <PipelineLane key={stage} title={stage} count={`${items.length} sponsor${items.length === 1 ? '' : 's'}`} total={formatCurrency(total)}>
              {items.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">No sponsors</div>
              ) : (
                items.slice(0, 4).map((sponsor) => (
                  <button key={sponsor.id} onClick={() => setSponsorModal({ open: true, editing: sponsor })} className="solid-panel w-full rounded-[var(--radius-lg)] px-3 py-3 text-left">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{sponsor.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatCurrency(sponsor.amount)} · {sponsor.packageName}</div>
                  </button>
                ))
              )}
            </PipelineLane>
          );
        })}
      </Pipeline>

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">Finance ledger</div>
        {filteredTransactions.length === 0 ? (
          <EmptyMoment icon={<Wallet size={20} />} title="No transactions yet" description="Add income or expenses to start the ledger." />
        ) : (
          <Ledger columns={['Date', 'Project', 'Category', 'Type', 'Amount', 'Paid by', 'Receipt', 'Status / Actions']}>
            {filteredTransactions.map((transaction) => (
              <LedgerRow
                key={transaction.id}
                cells={[
                  <span className="text-xs text-[var(--text-tertiary)]">{formatDate(transaction.date)}</span>,
                  <div className="min-w-0"><div className="truncate text-sm text-[var(--text-primary)]">{projects.find((project) => project.id === transaction.projectId)?.name ?? transaction.projectId}</div><div className="truncate text-xs text-[var(--text-tertiary)]">{transaction.notes || 'No notes'}</div></div>,
                  <span>{transaction.category}</span>,
                  <StatusBadge status={transaction.type === 'Income' ? 'Confirmed' : 'Pending'} subtle />,
                  <span className={`${transaction.type === 'Income' ? 'text-[var(--income)]' : 'text-[var(--danger)]'} font-medium`}>{formatCurrency(transaction.amount)}</span>,
                  <span>{transaction.paidBy || 'Unassigned'}</span>,
                  transaction.receiptLink ? <a href={transaction.receiptLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--accent)]"><ExternalLink size={11} /> Open</a> : <span className="text-[var(--warning)]">Missing</span>,
                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    <button className="btn-ghost text-xs" onClick={() => setTxnModal({ open: true, editing: transaction })}>Edit</button>
                    <button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDelTxn(transaction)}>Delete</button>
                  </div>,
                ]}
              />
            ))}
          </Ledger>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
        <WorkQueue title="Receipts & follow-ups queue">
          {[...receiptsQueue, ...followUpsQueue].length === 0 ? (
            <EmptyMoment icon={<Receipt size={20} />} title="No loose ends" description="Receipts and sponsor follow-ups are currently in good shape." />
          ) : (
            <>
              {receiptsQueue.map((transaction) => (
                <WorkQueueRow
                  key={transaction.id}
                  title={`${transaction.category} receipt missing`}
                  meta={projects.find((project) => project.id === transaction.projectId)?.name ?? transaction.projectId}
                  due={formatDate(transaction.date)}
                  action={<button className="btn-ghost text-xs" onClick={() => setTxnModal({ open: true, editing: transaction })}>Fix</button>}
                  tone="warning"
                />
              ))}
              {followUpsQueue.map((sponsor) => (
                <WorkQueueRow
                  key={sponsor.id}
                  title={`Follow up with ${sponsor.name}`}
                  meta={projects.find((project) => project.id === sponsor.projectId)?.name ?? sponsor.projectId}
                  due={sponsor.nextFollowUpDate ? formatDate(sponsor.nextFollowUpDate) : 'No date'}
                  status={<StatusBadge status={sponsor.paymentStatus} />}
                  action={<button className="btn-ghost text-xs" onClick={() => setSponsorModal({ open: true, editing: sponsor })}>Open</button>}
                  tone="critical"
                />
              ))}
            </>
          )}
        </WorkQueue>

        <div className="space-y-3">
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">Project breakdown matrix</div>
          <Matrix
            columns={['Project', 'Income', 'Expense', 'Surplus', 'Receipts', 'Sponsors']}
            rows={projectMatrix.map((row) => (
              <div key={row.project.id} className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(84px,1fr))] gap-3 border-b border-[var(--border-hairline)] px-4 py-3 last:border-b-0 md:px-5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">{row.project.name}</div>
                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">{row.project.status}</div>
                </div>
                <div className="text-sm text-[var(--income)]">{formatCurrency(row.income)}</div>
                <div className="text-sm text-[var(--danger)]">{formatCurrency(row.expense)}</div>
                <div className={`text-sm ${row.surplus >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{formatCurrency(row.surplus)}</div>
                <div><StatusBadge status={row.missingReceipts > 0 ? 'Needs Attention' : 'Healthy'} subtle /></div>
                <div className="text-sm text-[var(--money-gold)]">{formatCurrency(row.sponsorStatus)}</div>
              </div>
            ))}
          />
        </div>
      </div>

      <Modal open={txnModal.open} onClose={() => setTxnModal({ open: false })} title={txnModal.editing ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <TransactionForm initial={txnModal.editing} projects={projects} members={data.members} lockedProjectId={projectFilter === 'All' ? undefined : projectFilter} onSave={(transaction) => { saveTransaction(transaction); setTxnModal({ open: false }); }} onCancel={() => setTxnModal({ open: false })} />
      </Modal>

      <Modal open={sponsorModal.open} onClose={() => setSponsorModal({ open: false })} title={sponsorModal.editing ? 'Edit Sponsor' : 'New Sponsor'} size="lg">
        <SponsorForm initial={sponsorModal.editing} projects={projects} members={data.members} lockedProjectId={projectFilter === 'All' ? undefined : projectFilter} onSave={(sponsor) => { saveSponsor(sponsor); setSponsorModal({ open: false }); }} onCancel={() => setSponsorModal({ open: false })} />
      </Modal>

      <ConfirmDialog open={!!confirmDelTxn} title="Delete transaction?" message={`Delete this record of ${confirmDelTxn ? formatCurrency(confirmDelTxn.amount) : ''}?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelTxn) deleteTransaction(confirmDelTxn.id); setConfirmDelTxn(null); }} onCancel={() => setConfirmDelTxn(null)} />
      <ConfirmDialog open={!!confirmDelSponsor} title="Delete sponsor?" message={`Delete "${confirmDelSponsor?.name}"?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelSponsor) deleteSponsor(confirmDelSponsor.id); setConfirmDelSponsor(null); }} onCancel={() => setConfirmDelSponsor(null)} />
    </ScreenCanvas>
  );
}
