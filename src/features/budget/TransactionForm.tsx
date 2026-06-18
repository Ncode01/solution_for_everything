import React, { useMemo, useState } from 'react';
import { ExpenseQuotation, Member, Project, Transaction, TransactionCategory, TransactionType } from '../../types';
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
  for (let i = 0; i < 3; i += 1) {
    result.push(existing[i] ? { ...existing[i] } : emptyQuotation(i));
  }
  if (!result.some((quote) => quote.selected) && result[0]) result[0].selected = true;
  return result;
}

export default function TransactionForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    projectId: lockedProjectId ?? initial?.projectId ?? projects[0]?.id ?? '',
    type: (initial?.type ?? 'Expense') as TransactionType,
    category: (initial?.category ?? 'Venue') as TransactionCategory,
    itemName: initial?.itemName ?? initial?.notes ?? '',
    quantity: initial?.quantity ?? 1,
    unitCost: initial?.unitCost ?? (initial?.quantity ? Math.round((initial.amount ?? 0) / initial.quantity) : initial?.amount ?? 0),
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

  const filledQuotationCount = quotations.filter((quote) => quote.sellerName.trim()).length;
  const selectedQuote = useMemo(() => quotations.find((quote) => quote.selected), [quotations]);
  const calculatedAmount = form.type === 'Expense'
    ? (selectedQuote?.amount && selectedQuote.amount > 0 ? selectedQuote.amount : Math.max(1, Number(form.quantity) || 1) * (Number(form.unitCost) || 0))
    : Number(form.amount) || 0;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateQuotation(index: number, patch: Partial<ExpenseQuotation>) {
    setQuotations((current) => current.map((quote, currentIndex) => currentIndex === index ? { ...quote, ...patch } : quote));
  }

  function selectQuotation(index: number) {
    setQuotations((current) => current.map((quote, currentIndex) => ({ ...quote, selected: currentIndex === index })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = Math.max(1, Number(form.quantity) || 1);
    const amount = form.type === 'Expense'
      ? calculatedAmount
      : Number(form.amount) || 0;
    const unitCost = form.type === 'Expense'
      ? Number(form.unitCost) > 0
        ? Number(form.unitCost)
        : quantity > 0
          ? amount / quantity
          : amount
      : undefined;

    onSave({
      id: initial?.id ?? generateId(),
      projectId: form.projectId,
      type: form.type,
      category: form.category,
      itemName: form.type === 'Expense' ? (form.itemName.trim() || form.category) : undefined,
      quantity: form.type === 'Expense' ? quantity : undefined,
      unitCost,
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
      quotations: form.type === 'Expense'
        ? quotations.filter((quote) => quote.sellerName.trim() || quote.amount > 0 || quote.quotationLink?.trim())
        : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="select" value={form.type} onChange={(e) => set('type', e.target.value as TransactionType)}>
            {TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="select" value={form.category} onChange={(e) => set('category', e.target.value as TransactionCategory)}>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>

        {form.type === 'Expense' ? (
          <>
            <Field label="Expense Item" required className="sm:col-span-2">
              <input className="input" required value={form.itemName} onChange={(e) => set('itemName', e.target.value)} placeholder="e.g. Certificates printing" />
            </Field>
            <Field label="Number of Items" required>
              <input className="input" type="number" min={1} required value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value) || 1)} />
            </Field>
            <Field label="Per Item Cost (Rs)" required>
              <input className="input" type="number" min={0} required value={form.unitCost} onChange={(e) => set('unitCost', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Assigned Person">
              <MemberSelect members={members} value={form.assignedMemberId} onChange={(id, name) => setForm((current) => ({ ...current, assignedMemberId: id, assignedMember: name }))} placeholder="Select member..." />
            </Field>
            <Field label="Approved By">
              <MemberSelect members={members} value={form.approvedById} onChange={(id, name) => setForm((current) => ({ ...current, approvedById: id, approvedBy: name }))} placeholder="Select member..." />
            </Field>
          </>
        ) : (
          <>
            <Field label="Amount (Rs)" required>
              <input className="input" type="number" min={0} required value={form.amount} onChange={(e) => set('amount', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Received By">
              <MemberSelect members={members} value={form.paidById} onChange={(id, name) => setForm((current) => ({ ...current, paidById: id, paidBy: name }))} placeholder="Select member..." />
            </Field>
            <Field label="Approved By">
              <MemberSelect members={members} value={form.approvedById} onChange={(id, name) => setForm((current) => ({ ...current, approvedById: id, approvedBy: name }))} placeholder="Select member..." />
            </Field>
          </>
        )}

        <Field label={form.type === 'Expense' ? 'Receipt / payment proof link' : 'Receipt / proof link'} className="sm:col-span-2">
          <input className="input" value={form.receiptLink} onChange={(e) => set('receiptLink', e.target.value)} placeholder="https://drive.google.com/..." />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>

      {form.type === 'Expense' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Quotations Taken</div>
              <div className="mt-1 text-xs text-[var(--text-tertiary)]">Each quotation can carry its own seller and Drive link. Selecting one makes it the chosen seller for this row.</div>
            </div>
            <div className="text-right">
              <div className={`text-xs ${filledQuotationCount < 3 ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}`}>{filledQuotationCount}/3 quotations filled</div>
              <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Total {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(calculatedAmount || 0)}</div>
            </div>
          </div>

          {quotations.map((quote, index) => (
            <div key={quote.id} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white/[0.03] p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_minmax(0,1fr)_140px_minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] lg:pt-8">
                  <input type="radio" name="selectedQuote" checked={!!quote.selected} onChange={() => selectQuotation(index)} />
                  Q{index + 1}
                </label>
                <Field label="Seller">
                  <input className="input text-sm" value={quote.sellerName} onChange={(e) => updateQuotation(index, { sellerName: e.target.value })} placeholder="Vendor / seller name" />
                </Field>
                <Field label="Quotation Total (Rs)">
                  <input className="input text-sm" type="number" min={0} value={quote.amount || ''} onChange={(e) => updateQuotation(index, { amount: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Contact">
                  <input className="input text-sm" value={quote.contact ?? ''} onChange={(e) => updateQuotation(index, { contact: e.target.value })} placeholder="Phone or contact person" />
                </Field>
                <Field label="Quotation Drive Link">
                  <input className="input text-sm" value={quote.quotationLink ?? ''} onChange={(e) => updateQuotation(index, { quotationLink: e.target.value })} placeholder="https://drive.google.com/..." />
                </Field>
              </div>
            </div>
          ))}

          {filledQuotationCount < 3 ? (
            <div className="rounded-[var(--radius-lg)] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Fewer than three quotations are filled. You can still save, but this row will stay visibly incomplete in the budget table.
            </div>
          ) : null}
        </div>
      ) : null}

      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Record'} onCancel={onCancel} />
    </form>
  );
}
