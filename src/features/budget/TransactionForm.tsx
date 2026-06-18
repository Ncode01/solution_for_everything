import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionCategory, Project, Member, ExpenseQuotation } from '../../types';
import { generateId, todayISO } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  initial?: Transaction;
  projects: Project[];
  members: Member[];
  lockedProjectId?: string;
  onSave: (t: Transaction) => void;
  onCancel: () => void;
}

const TYPES: TransactionType[] = ['Income', 'Expense'];
const CATEGORIES: TransactionCategory[] = [
  'Venue', 'Audio/Visual', 'Lighting', 'Decorations', 'Certificates', 'Medals', 'Trophies',
  'Refreshments', 'Transport', 'Printing', 'PR', 'Web/IT', 'Equipment', 'Sponsorship', 'Miscellaneous',
];

function emptyQuotation(index: number): ExpenseQuotation {
  return { id: generateId(), sellerName: '', amount: 0, selected: index === 0 };
}

function initQuotations(initial?: Transaction): ExpenseQuotation[] {
  const existing = initial?.quotations ?? [];
  const result: ExpenseQuotation[] = [];
  for (let i = 0; i < 3; i++) {
    result.push(existing[i] ? { ...existing[i] } : emptyQuotation(i));
  }
  if (!result.some((q) => q.selected) && result[0]) result[0].selected = true;
  return result;
}

export default function TransactionForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    projectId: lockedProjectId ?? initial?.projectId ?? projects[0]?.id ?? '',
    type: (initial?.type ?? 'Expense') as TransactionType,
    category: (initial?.category ?? 'Venue') as TransactionCategory,
    amount: initial?.amount ?? 0,
    date: initial?.date ?? todayISO(),
    paidBy: initial?.paidBy ?? '',
    paidById: initial?.paidById ?? '',
    approvedBy: initial?.approvedBy ?? '',
    approvedById: initial?.approvedById ?? '',
    assignedMember: initial?.assignedMember ?? '',
    assignedMemberId: initial?.assignedMemberId ?? initial?.paidById ?? '',
    receiptLink: initial?.receiptLink ?? '',
    notes: initial?.notes ?? '',
  });
  const [quotations, setQuotations] = useState<ExpenseQuotation[]>(initQuotations(initial));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateQuotation(index: number, patch: Partial<ExpenseQuotation>) {
    setQuotations((prev) => prev.map((q, i) => i === index ? { ...q, ...patch } : q));
  }

  function selectQuotation(index: number) {
    setQuotations((prev) => prev.map((q, i) => ({ ...q, selected: i === index })));
    const selected = quotations[index];
    if (selected?.amount) set('amount', selected.amount);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedQuote = quotations.find((q) => q.selected);
    const amount = selectedQuote?.amount && form.type === 'Expense' ? selectedQuote.amount : Number(form.amount) || 0;
    onSave({
      id: initial?.id ?? generateId(),
      projectId: form.projectId,
      type: form.type,
      category: form.category,
      amount,
      date: form.date,
      paidBy: form.paidBy || undefined,
      paidById: form.paidById || undefined,
      approvedBy: form.approvedBy || undefined,
      approvedById: form.approvedById || undefined,
      assignedMember: form.assignedMember || undefined,
      assignedMemberId: form.assignedMemberId || undefined,
      receiptLink: form.receiptLink || undefined,
      notes: form.notes || undefined,
      quotations: form.type === 'Expense' ? quotations.filter((q) => q.sellerName.trim() || q.amount > 0) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="select" value={form.type} onChange={(e) => set('type', e.target.value as TransactionType)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="select" value={form.category} onChange={(e) => set('category', e.target.value as TransactionCategory)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (Rs)" required>
          <input className="input" type="number" min={0} required value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} />
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        {form.type === 'Income' ? (
          <>
            <Field label="Received / Paid By">
              <MemberSelect members={members} value={form.paidById} onChange={(id, name) => setForm((f) => ({ ...f, paidById: id, paidBy: name }))} placeholder="Select member…" />
            </Field>
            <Field label="Approved By">
              <MemberSelect members={members} value={form.approvedById} onChange={(id, name) => setForm((f) => ({ ...f, approvedById: id, approvedBy: name }))} placeholder="Select member…" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Assigned Member">
              <MemberSelect members={members} value={form.assignedMemberId} onChange={(id, name) => setForm((f) => ({ ...f, assignedMemberId: id, assignedMember: name }))} placeholder="Select member…" />
            </Field>
            <Field label="Approved By">
              <MemberSelect members={members} value={form.approvedById} onChange={(id, name) => setForm((f) => ({ ...f, approvedById: id, approvedBy: name }))} placeholder="Select member…" />
            </Field>
          </>
        )}
        <Field label="Receipt / proof link" className="col-span-2">
          <input className="input" value={form.receiptLink} onChange={(e) => set('receiptLink', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Notes" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>

      {form.type === 'Expense' && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Quotations (up to 3)</div>
          {quotations.map((quote, index) => (
            <div key={quote.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_100px_1fr_1fr] gap-2 items-end rounded-lg border border-[var(--border-subtle)] p-2">
              <label className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] pb-2">
                <input type="radio" name="selectedQuote" checked={!!quote.selected} onChange={() => selectQuotation(index)} />
                Q{index + 1}
              </label>
              <Field label="Seller">
                <input className="input text-sm" value={quote.sellerName} onChange={(e) => updateQuotation(index, { sellerName: e.target.value })} />
              </Field>
              <Field label="Amount">
                <input className="input text-sm" type="number" min={0} value={quote.amount || ''} onChange={(e) => updateQuotation(index, { amount: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="Contact">
                <input className="input text-sm" value={quote.contact ?? ''} onChange={(e) => updateQuotation(index, { contact: e.target.value })} />
              </Field>
              <Field label="Link">
                <input className="input text-sm" value={quote.quotationLink ?? ''} onChange={(e) => updateQuotation(index, { quotationLink: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>
      )}

      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Record'} onCancel={onCancel} />
    </form>
  );
}
