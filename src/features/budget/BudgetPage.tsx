import React, { useMemo, useState } from 'react';
import { Download, Handshake, Plus, Wallet } from 'lucide-react';
import { Sponsor, SponsorStage, Transaction } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { toCSV, downloadCSV } from '../../lib/csvExport';
import { formatCurrency, formatDate, isOverdue } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import SegmentedControl from '../../components/design/SegmentedControl';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import Pipeline from '../../components/layout/Pipeline';
import PipelineLane from '../../components/layout/PipelineLane';
import Ledger from '../../components/layout/Ledger';
import LedgerRow from '../../components/layout/LedgerRow';
import WorkQueue from '../../components/layout/WorkQueue';
import WorkQueueRow from '../../components/layout/WorkQueueRow';
import EmptyMoment from '../../components/layout/EmptyMoment';
import SponsorForm from '../sponsors/SponsorForm';
import TransactionForm from './TransactionForm';

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];

type MoneyTab = 'sponsors' | 'budget';

export default function BudgetPage() {
  const { data, saveTransaction, deleteTransaction, saveSponsor, deleteSponsor } = useAppData();
  const { projects, sponsors, transactions } = data;
  const [tab, setTab] = useState<MoneyTab>('sponsors');
  const [projectFilter, setProjectFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState<SponsorStage | 'All'>('All');
  const [txnModal, setTxnModal] = useState<{ open: boolean; editing?: Transaction; type?: 'Income' | 'Expense' }>({ open: false });
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [confirmDelTxn, setConfirmDelTxn] = useState<Transaction | null>(null);
  const [confirmDelSponsor, setConfirmDelSponsor] = useState<Sponsor | null>(null);

  useAutoNew(() => setSponsorModal({ open: true }));

  const filteredSponsors = sponsors
    .filter((sponsor) => (projectFilter === 'All' || sponsor.projectId === projectFilter) && (stageFilter === 'All' || sponsor.stage === stageFilter));

  const confirmedIncome = useMemo(() => transactions
    .filter((t) => t.type === 'Income' && (projectFilter === 'All' || t.projectId === projectFilter))
    .reduce((sum, t) => sum + t.amount, 0), [projectFilter, transactions]);

  const confirmedExpenses = useMemo(() => transactions
    .filter((t) => t.type === 'Expense' && (projectFilter === 'All' || t.projectId === projectFilter)), [projectFilter, transactions]);

  const confirmedExpenseTotal = confirmedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const missingReceipts = confirmedExpenses.filter((t) => !t.receiptLink).length;
  const missingQuotations = confirmedExpenses.filter((t) => (t.quotations?.filter((q) => q.sellerName.trim()).length ?? 0) < 3).length;

  const incomeRows = transactions
    .filter((t) => t.type === 'Income' && (projectFilter === 'All' || t.projectId === projectFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const expenseRows = confirmedExpenses.sort((a, b) => b.date.localeCompare(a.date));

  const followUpsQueue = filteredSponsors.filter((sponsor) => sponsor.nextFollowUpDate && isOverdue(sponsor.nextFollowUpDate) && sponsor.stage !== 'Confirmed' && sponsor.stage !== 'Completed' && sponsor.stage !== 'Rejected');

  function renderQuotationChips(transaction: Transaction) {
    const quotes = transaction.quotations ?? [];
    const filled = quotes.filter((q) => q.sellerName.trim()).length;
    if (filled === 0) return <span className="text-[var(--warning)] text-xs">No quotes</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {[0, 1, 2].map((i) => {
          const q = quotes[i];
          if (!q?.sellerName.trim()) {
            return <span key={i} className="text-[10px] text-[var(--text-tertiary)]">—</span>;
          }
          return (
            <span key={q.id} className={`rounded px-1.5 py-0.5 text-[10px] ${q.selected ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
              {q.sellerName}: {formatCurrency(q.amount)}
            </span>
          );
        })}
        {filled < 3 && <span className="text-[10px] text-[var(--warning)]">Missing quote {filled}/3</span>}
      </div>
    );
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Money"
        description="Sponsors and confirmed financial records for RCCS projects."
        tone="money"
        primaryAction={
          tab === 'budget'
            ? <button className="btn-primary" onClick={() => setTxnModal({ open: true, type: 'Expense' })}><Plus size={16} /> New Expense</button>
            : <button className="btn-primary" onClick={() => setSponsorModal({ open: true })}><Handshake size={15} /> New Sponsor</button>
        }
        secondaryActions={
          tab === 'budget'
            ? <button className="btn-secondary" onClick={() => setTxnModal({ open: true, type: 'Income' })}><Plus size={15} /> New Income</button>
            : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'sponsors', label: 'Sponsors', icon: <Handshake size={13} /> },
            { value: 'budget', label: 'Budget', icon: <Wallet size={13} /> },
          ]}
        />
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {tab === 'sponsors' && (
          <select className="select w-40" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SponsorStage | 'All')}>
            <option value="All">All sponsor stages</option>
            {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
          </select>
        )}
      </div>

      {tab === 'sponsors' && (
        <>
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
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatCurrency(sponsor.amount)} · {sponsor.assignedMember || 'Unassigned'}</div>
                        <div className="mt-1"><StatusBadge status={sponsor.paymentStatus} subtle /></div>
                      </button>
                    ))
                  )}
                </PipelineLane>
              );
            })}
          </Pipeline>

          <section className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Sponsor list</div>
            {filteredSponsors.length === 0 ? (
              <EmptyMoment icon={<Handshake size={20} />} title="No sponsors" description="Add sponsors to track pipeline and payments." />
            ) : (
              <div className="space-y-2">
                {filteredSponsors.map((sponsor) => (
                  <button key={sponsor.id} onClick={() => setSponsorModal({ open: true, editing: sponsor })} className="solid-panel flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] px-4 py-3 text-left">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{sponsor.name}</div>
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">{projects.find((p) => p.id === sponsor.projectId)?.name} · {sponsor.assignedMember || 'Unassigned'} · {sponsor.nextFollowUpDate ? `Follow-up ${formatDate(sponsor.nextFollowUpDate)}` : 'No follow-up'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sponsor.stage} />
                      <span className="text-sm text-[var(--money-gold)]">{formatCurrency(sponsor.amount)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {followUpsQueue.length > 0 && (
            <WorkQueue title="Follow-ups due">
              {followUpsQueue.map((sponsor) => (
                <WorkQueueRow
                  key={sponsor.id}
                  title={`Follow up: ${sponsor.name}`}
                  meta={projects.find((p) => p.id === sponsor.projectId)?.name ?? sponsor.projectId}
                  due={sponsor.nextFollowUpDate ? formatDate(sponsor.nextFollowUpDate) : 'No date'}
                  action={<button className="btn-ghost text-xs" onClick={() => setSponsorModal({ open: true, editing: sponsor })}>Open</button>}
                  tone="critical"
                />
              ))}
            </WorkQueue>
          )}
        </>
      )}

      {tab === 'budget' && (
        <>
          <div className="flex flex-wrap gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-black/10 px-4 py-3 text-sm">
            <span><span className="text-[var(--text-tertiary)]">Confirmed Income</span> <strong className="text-[var(--income)]">{formatCurrency(confirmedIncome)}</strong></span>
            <span><span className="text-[var(--text-tertiary)]">Confirmed Expense</span> <strong className="text-[var(--danger)]">{formatCurrency(confirmedExpenseTotal)}</strong></span>
            <span><span className="text-[var(--text-tertiary)]">Net Balance</span> <strong className={confirmedIncome - confirmedExpenseTotal >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>{formatCurrency(confirmedIncome - confirmedExpenseTotal)}</strong></span>
            <span><span className="text-[var(--text-tertiary)]">Missing Receipts</span> <strong className="text-[var(--warning)]">{missingReceipts}</strong></span>
            <span><span className="text-[var(--text-tertiary)]">Missing 3 Quotations</span> <strong className="text-[var(--warning)]">{missingQuotations}</strong></span>
            <button
              className="btn-secondary text-xs ml-auto"
              onClick={() => downloadCSV(toCSV(transactions.map((t) => ({
                Date: t.date, Project: projects.find((p) => p.id === t.projectId)?.name ?? t.projectId,
                Type: t.type, Category: t.category, Amount: t.amount,
              }))), `budget-${new Date().toISOString().slice(0, 10)}.csv`)}
            >
              <Download size={14} /> Export
            </button>
          </div>

          <section className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Confirmed Income</div>
            {incomeRows.length === 0 ? (
              <EmptyMoment title="No confirmed income" description="Add income records as money is received." />
            ) : (
              <Ledger columns={['Date', 'Category', 'Description', 'Amount', 'Received By', 'Approved By', 'Receipt', 'Actions']}>
                {incomeRows.map((t) => (
                  <LedgerRow
                    key={t.id}
                    cells={[
                      <span className="text-xs">{formatDate(t.date)}</span>,
                      <span>{t.category}</span>,
                      <span className="text-xs text-[var(--text-tertiary)]">{t.notes || '—'}</span>,
                      <span className="text-[var(--income)] font-medium">{formatCurrency(t.amount)}</span>,
                      <span className="text-xs">{t.paidBy || '—'}</span>,
                      <span className="text-xs">{t.approvedBy || '—'}</span>,
                      t.receiptLink ? <a href={t.receiptLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)]">Open</a> : <span className="text-xs text-[var(--text-tertiary)]">—</span>,
                      <div className="flex gap-2"><button className="btn-ghost text-xs" onClick={() => setTxnModal({ open: true, editing: t })}>Edit</button><button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDelTxn(t)}>Delete</button></div>,
                    ]}
                  />
                ))}
              </Ledger>
            )}
          </section>

          <section className="space-y-3">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Confirmed Expenses</div>
            {expenseRows.length === 0 ? (
              <EmptyMoment title="No confirmed expenses" description="Add expense records with quotations." />
            ) : (
              <Ledger columns={['Date', 'Category', 'Item', 'Assigned', 'Selected', 'Quotations', 'Receipt', 'Approved', 'Actions']}>
                {expenseRows.map((t) => {
                  const selected = t.quotations?.find((q) => q.selected);
                  return (
                    <LedgerRow
                      key={t.id}
                      cells={[
                        <span className="text-xs">{formatDate(t.date)}</span>,
                        <span>{t.category}</span>,
                        <span className="text-xs text-[var(--text-tertiary)]">{t.notes || '—'}</span>,
                        <span className="text-xs">{t.assignedMember || t.paidBy || '—'}</span>,
                        <span className="text-xs">{selected ? `${selected.sellerName} · ${formatCurrency(selected.amount)}` : formatCurrency(t.amount)}</span>,
                        renderQuotationChips(t),
                        t.receiptLink ? <a href={t.receiptLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)]">Open</a> : <span className="text-xs text-[var(--warning)]">Missing</span>,
                        <span className="text-xs">{t.approvedBy || '—'}</span>,
                        <div className="flex gap-2"><button className="btn-ghost text-xs" onClick={() => setTxnModal({ open: true, editing: t })}>Edit Quotes</button><button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDelTxn(t)}>Delete</button></div>,
                      ]}
                    />
                  );
                })}
              </Ledger>
            )}
          </section>
        </>
      )}

      <Modal open={txnModal.open} onClose={() => setTxnModal({ open: false })} title={txnModal.editing ? 'Edit Transaction' : txnModal.type === 'Income' ? 'New Income' : 'New Expense'} size="lg">
        <TransactionForm
          initial={txnModal.editing ?? (txnModal.type ? { type: txnModal.type } as Transaction : undefined)}
          projects={projects}
          members={data.members}
          lockedProjectId={projectFilter === 'All' ? undefined : projectFilter}
          onSave={(transaction) => { saveTransaction(transaction); setTxnModal({ open: false }); }}
          onCancel={() => setTxnModal({ open: false })}
        />
      </Modal>

      <Modal open={sponsorModal.open} onClose={() => setSponsorModal({ open: false })} title={sponsorModal.editing ? 'Edit Sponsor' : 'New Sponsor'} size="lg">
        <SponsorForm initial={sponsorModal.editing} projects={projects} members={data.members} lockedProjectId={projectFilter === 'All' ? undefined : projectFilter} onSave={(sponsor) => { saveSponsor(sponsor); setSponsorModal({ open: false }); }} onCancel={() => setSponsorModal({ open: false })} />
      </Modal>

      <ConfirmDialog open={!!confirmDelTxn} title="Delete transaction?" message={`Delete this record of ${confirmDelTxn ? formatCurrency(confirmDelTxn.amount) : ''}?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelTxn) deleteTransaction(confirmDelTxn.id); setConfirmDelTxn(null); }} onCancel={() => setConfirmDelTxn(null)} />
      <ConfirmDialog open={!!confirmDelSponsor} title="Delete sponsor?" message={`Delete "${confirmDelSponsor?.name}"?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelSponsor) deleteSponsor(confirmDelSponsor.id); setConfirmDelSponsor(null); }} onCancel={() => setConfirmDelSponsor(null)} />
    </ScreenCanvas>
  );
}
