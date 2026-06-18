import React, { useMemo, useState } from 'react';
import { Download, ExternalLink, Handshake, Plus, Wallet } from 'lucide-react';
import { Budget, Sponsor, SponsorStage, Transaction } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { downloadCSV, toCSV } from '../../lib/csvExport';
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
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';
import SponsorForm from '../sponsors/SponsorForm';
import TransactionForm from './TransactionForm';

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];

type MoneyTab = 'sponsors' | 'budget';

type ExpenseRow = {
  transaction: Transaction;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  selectedSeller?: string;
  quotationsTaken: number;
  assignedPerson: string;
};

function normalizeExpenseRow(transaction: Transaction): ExpenseRow {
  const quantity = Math.max(1, Number(transaction.quantity) || 1);
  const selectedQuote = transaction.quotations?.find((quote) => quote.selected && quote.amount > 0);
  const totalCost = selectedQuote?.amount && selectedQuote.amount > 0
    ? selectedQuote.amount
    : Number(transaction.amount) || (Number(transaction.unitCost) || 0) * quantity;

  return {
    transaction,
    itemName: transaction.itemName?.trim() || transaction.notes?.trim() || transaction.category,
    quantity,
    unitCost: Number(transaction.unitCost) > 0 ? Number(transaction.unitCost) : quantity > 0 ? totalCost / quantity : totalCost,
    totalCost,
    selectedSeller: selectedQuote?.sellerName?.trim() || undefined,
    quotationsTaken: transaction.quotations?.filter((quote) => quote.sellerName.trim()).length ?? 0,
    assignedPerson: transaction.assignedMember || 'Unassigned',
  };
}

function projectBudgetSummary(budget: Budget | undefined, rows: ExpenseRow[]) {
  const plannedExpense = budget?.expectedExpense ?? 0;
  const actualExpense = rows.reduce((sum, row) => sum + row.totalCost, 0);
  return {
    plannedExpense,
    actualExpense,
    remaining: plannedExpense - actualExpense,
  };
}

export default function BudgetPage() {
  const { data, saveTransaction, deleteTransaction, saveSponsor, deleteSponsor } = useAppData();
  const { projects, sponsors, budgets, transactions } = data;
  const [tab, setTab] = useState<MoneyTab>('sponsors');
  const [sponsorProjectFilter, setSponsorProjectFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState<SponsorStage | 'All'>('All');
  const [budgetProjectId, setBudgetProjectId] = useState(projects[0]?.id ?? '');
  const [txnModal, setTxnModal] = useState<{ open: boolean; editing?: Transaction; type?: 'Income' | 'Expense' }>({ open: false });
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [confirmDelTxn, setConfirmDelTxn] = useState<Transaction | null>(null);
  const [confirmDelSponsor, setConfirmDelSponsor] = useState<Sponsor | null>(null);

  useAutoNew(() => setSponsorModal({ open: true }));

  const filteredSponsors = sponsors
    .filter((sponsor) => (sponsorProjectFilter === 'All' || sponsor.projectId === sponsorProjectFilter) && (stageFilter === 'All' || sponsor.stage === stageFilter));

  const sponsorFollowUps = filteredSponsors.filter((sponsor) => sponsor.nextFollowUpDate && isOverdue(sponsor.nextFollowUpDate) && !['Confirmed', 'Completed', 'Rejected'].includes(sponsor.stage));

  const currentProject = projects.find((project) => project.id === budgetProjectId);
  const currentBudget = budgets.find((budget) => budget.projectId === budgetProjectId);

  const expenseRows = useMemo(() => transactions
    .filter((transaction) => transaction.projectId === budgetProjectId && transaction.type === 'Expense')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(normalizeExpenseRow), [budgetProjectId, transactions]);

  const budgetStats = useMemo(() => projectBudgetSummary(currentBudget, expenseRows), [currentBudget, expenseRows]);

  function renderQuotationChips(transaction: Transaction) {
    const selectedQuote = transaction.quotations?.find((quote) => quote.selected);

    if (!transaction.quotations || transaction.quotations.length === 0) {
      return <span className="text-xs text-[var(--text-tertiary)]">No quotations</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {transaction.quotations.map((quote, index) => {
          const content = (
            <>
              <span>{quote.sellerName || `Q${index + 1}`}</span>
              {quote.amount > 0 ? <span>{formatCurrency(quote.amount)}</span> : null}
              {quote.selected ? (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-100">
                  Seller
                </span>
              ) : null}
            </>
          );

          if (quote.quotationLink) {
            return (
              <a
                key={quote.id}
                href={quote.quotationLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  quote.selected
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                    : 'border-[var(--border-subtle)] bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.07]'
                }`}
              >
                {content}
                <ExternalLink size={10} />
              </a>
            );
          }

          return (
            <span
              key={quote.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                quote.selected
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                  : 'border-[var(--border-subtle)] bg-white/[0.04] text-[var(--text-secondary)]'
              }`}
            >
              {content}
            </span>
          );
        })}
        {!selectedQuote ? <StatusBadge status="No Seller Selected" subtle /> : null}
      </div>
    );
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Money"
        description="Project budgets now open one at a time with a cleaner expense table and a dedicated mobile view."
        tone="money"
        primaryAction={
          tab === 'budget'
            ? <button className="btn-primary" onClick={() => setTxnModal({ open: true, type: 'Expense' })} disabled={!budgetProjectId}><Plus size={16} /> Add Expense</button>
            : <button className="btn-primary" onClick={() => setSponsorModal({ open: true })}><Handshake size={15} /> New Sponsor</button>
        }
        secondaryActions={
          tab === 'budget'
            ? <button className="btn-secondary" onClick={() => setTxnModal({ open: true, type: 'Income' })} disabled={!budgetProjectId}><Plus size={15} /> Add Income</button>
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

        {tab === 'sponsors' ? (
          <>
            <select className="select w-48" value={sponsorProjectFilter} onChange={(e) => setSponsorProjectFilter(e.target.value)}>
              <option value="All">All projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select className="select w-40" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SponsorStage | 'All')}>
              <option value="All">All sponsor stages</option>
              {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </>
        ) : (
          <select className="select min-w-[18rem]" value={budgetProjectId} onChange={(e) => setBudgetProjectId(e.target.value)}>
            <option value="">Select project budget</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        )}
      </div>

      {tab === 'sponsors' ? (
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
                    items.slice(0, 6).map((sponsor) => (
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

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
            <Card className="space-y-3 p-4">
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">Sponsor list</div>
              {filteredSponsors.length === 0 ? (
                <EmptyMoment icon={<Handshake size={20} />} title="No sponsors" description="Add sponsors to track pipeline and payments." />
              ) : (
                filteredSponsors.map((sponsor) => (
                  <button key={sponsor.id} onClick={() => setSponsorModal({ open: true, editing: sponsor })} className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{sponsor.name}</div>
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {projects.find((project) => project.id === sponsor.projectId)?.name} · {sponsor.assignedMember || 'Unassigned'} · {sponsor.nextFollowUpDate ? `Follow-up ${formatDate(sponsor.nextFollowUpDate)}` : 'No follow-up'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sponsor.stage} />
                      <span className="text-sm text-[var(--money-gold)]">{formatCurrency(sponsor.amount)}</span>
                    </div>
                  </button>
                ))
              )}
            </Card>

            <Card className="space-y-3 p-4">
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">Follow-ups due</div>
              {sponsorFollowUps.length === 0 ? (
                <EmptyMoment title="No overdue sponsor follow-ups" description="The sponsor queue is under control." />
              ) : (
                sponsorFollowUps.map((sponsor) => (
                  <div key={sponsor.id} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white/[0.03] px-4 py-3">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{sponsor.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{projects.find((project) => project.id === sponsor.projectId)?.name} · {sponsor.assignedMember || 'Unassigned'}</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <StatusBadge status={sponsor.paymentStatus} subtle />
                      <button className="btn-ghost text-xs" onClick={() => setSponsorModal({ open: true, editing: sponsor })}>Open</button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        </>
      ) : (
        <>
          {!currentProject ? (
            <EmptyMoment title="Choose a project budget" description="Budget is intentionally project-by-project, so select one project to open its table." />
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Project</div>
                  <div className="mt-2 text-base font-semibold text-[var(--text-primary)]">{currentProject.name}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Planned Expense</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(budgetStats.plannedExpense)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Current Total</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--danger)]">{formatCurrency(budgetStats.actualExpense)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Remaining</div>
                  <div className={`mt-2 text-xl font-semibold ${budgetStats.remaining >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{formatCurrency(budgetStats.remaining)}</div>
                </Card>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-[var(--text-primary)]">Budget table</div>
                  <div className="mt-1 text-sm text-[var(--text-tertiary)]">A single project budget with explicit rows, seller selection, and always-accessible Drive links.</div>
                </div>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => downloadCSV(toCSV(expenseRows.map((row) => ({
                    Project: currentProject.name,
                    Category: row.transaction.category,
                    ExpenseItem: row.itemName,
                    Quantity: row.quantity,
                    UnitCost: row.unitCost,
                    TotalCost: row.totalCost,
                    Seller: row.selectedSeller ?? '',
                    AssignedPerson: row.assignedPerson,
                  }))), `${currentProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-budget.csv`)}
                >
                  <Download size={14} /> Export
                </button>
              </div>

              {expenseRows.length === 0 ? (
                <EmptyMoment title="No expense rows yet" description="Add the first project expense and it will appear here in the new budget table." />
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-[1180px] w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-hairline)] bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                            <th className="px-4 py-3 font-semibold">Expense Item</th>
                            <th className="px-4 py-3 font-semibold">Nos</th>
                            <th className="px-4 py-3 font-semibold">Per Item Cost</th>
                            <th className="px-4 py-3 font-semibold">Total Cost</th>
                            <th className="px-4 py-3 font-semibold">Quotations Taken</th>
                            <th className="px-4 py-3 font-semibold">Assigned Person</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseRows.map((row) => (
                            <tr key={row.transaction.id} className="border-b border-[var(--border-hairline)] align-top last:border-b-0">
                              <td className="px-4 py-4">
                                <div className="min-w-[180px]">
                                  <div className="text-sm font-semibold text-[var(--text-primary)]">{row.itemName}</div>
                                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">{row.transaction.category} · {formatDate(row.transaction.date)}</div>
                                  {row.transaction.notes ? <div className="mt-1 text-xs text-[var(--text-secondary)]">{row.transaction.notes}</div> : null}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-[var(--text-primary)]">{row.quantity}</td>
                              <td className="px-4 py-4 text-sm text-[var(--text-primary)]">{formatCurrency(row.unitCost)}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(row.totalCost)}</td>
                              <td className="px-4 py-4">
                                <div className="space-y-2">
                                  <div className="text-xs text-[var(--text-tertiary)]">{row.quotationsTaken}/3 quotations</div>
                                  {renderQuotationChips(row.transaction)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-[var(--text-primary)]">{row.assignedPerson}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button className="btn-primary text-xs" onClick={() => setTxnModal({ open: true, editing: row.transaction })}>Open</button>
                                  <button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDelTxn(row.transaction)}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {expenseRows.map((row) => (
                      <Card key={row.transaction.id} className="space-y-4 rounded-[28px] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-semibold text-[var(--text-primary)]">{row.itemName}</div>
                            <div className="mt-1 text-xs text-[var(--text-tertiary)]">{row.transaction.category} · {formatDate(row.transaction.date)}</div>
                          </div>
                          <div className="rounded-full border border-[var(--border-subtle)] bg-white/[0.05] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
                            {formatCurrency(row.totalCost)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white/[0.04] p-3">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Nos</div>
                            <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{row.quantity}</div>
                          </div>
                          <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white/[0.04] p-3">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Per Item Cost</div>
                            <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(row.unitCost)}</div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white/[0.04] p-3">
                          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Assigned Person</div>
                          <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{row.assignedPerson}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Quotations Taken</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{row.quotationsTaken}/3</div>
                          </div>
                          {renderQuotationChips(row.transaction)}
                        </div>

                        {row.transaction.notes ? <div className="text-sm text-[var(--text-secondary)]">{row.transaction.notes}</div> : null}

                        <div className="flex gap-2">
                          <button className="btn-primary flex-1 text-xs" onClick={() => setTxnModal({ open: true, editing: row.transaction })}>Open</button>
                          <button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDelTxn(row.transaction)}>Delete</button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <Modal open={txnModal.open} onClose={() => setTxnModal({ open: false })} title={txnModal.editing ? 'Edit Budget Row' : txnModal.type === 'Income' ? 'New Income' : 'New Expense'} size="lg">
        <TransactionForm
          initial={txnModal.editing ?? (txnModal.type ? { type: txnModal.type, projectId: budgetProjectId } as Transaction : undefined)}
          projects={projects}
          members={data.members}
          lockedProjectId={tab === 'budget' && budgetProjectId ? budgetProjectId : undefined}
          onSave={(transaction) => { saveTransaction(transaction); setTxnModal({ open: false }); }}
          onCancel={() => setTxnModal({ open: false })}
        />
      </Modal>

      <Modal open={sponsorModal.open} onClose={() => setSponsorModal({ open: false })} title={sponsorModal.editing ? 'Edit Sponsor' : 'New Sponsor'} size="lg">
        <SponsorForm initial={sponsorModal.editing} projects={projects} members={data.members} lockedProjectId={sponsorProjectFilter === 'All' ? undefined : sponsorProjectFilter} onSave={(sponsor) => { saveSponsor(sponsor); setSponsorModal({ open: false }); }} onCancel={() => setSponsorModal({ open: false })} />
      </Modal>

      <ConfirmDialog open={!!confirmDelTxn} title="Delete transaction?" message={`Delete this record of ${confirmDelTxn ? formatCurrency(confirmDelTxn.amount) : ''}?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelTxn) deleteTransaction(confirmDelTxn.id); setConfirmDelTxn(null); }} onCancel={() => setConfirmDelTxn(null)} />
      <ConfirmDialog open={!!confirmDelSponsor} title="Delete sponsor?" message={`Delete "${confirmDelSponsor?.name}"?`} confirmLabel="Delete" onConfirm={() => { if (confirmDelSponsor) deleteSponsor(confirmDelSponsor.id); setConfirmDelSponsor(null); }} onCancel={() => setConfirmDelSponsor(null)} />
    </ScreenCanvas>
  );
}
