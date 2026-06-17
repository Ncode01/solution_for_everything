import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionCategory, Project, Member } from '../../types';
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
    receiptLink: initial?.receiptLink ?? '',
    notes: initial?.notes ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      projectId: form.projectId,
      type: form.type,
      category: form.category,
      amount: Number(form.amount) || 0,
      date: form.date,
      paidBy: form.paidBy || undefined,
      paidById: form.paidById || undefined,
      approvedBy: form.approvedBy || undefined,
      approvedById: form.approvedById || undefined,
      receiptLink: form.receiptLink || undefined,
      notes: form.notes || undefined,
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
        <div />
        <Field label="Paid By">
          <MemberSelect
            members={members}
            value={form.paidById}
            onChange={(id, name) => setForm((f) => ({ ...f, paidById: id, paidBy: name }))}
            placeholder="Select member…"
          />
        </Field>
        <Field label="Approved By">
          <MemberSelect
            members={members}
            value={form.approvedById}
            onChange={(id, name) => setForm((f) => ({ ...f, approvedById: id, approvedBy: name }))}
            placeholder="Select member…"
          />
        </Field>
        <Field
          label="Receipt Link"
          hint={form.type === 'Expense' && !form.receiptLink ? 'Expenses should have a receipt link.' : undefined}
          className="col-span-2"
        >
          <input className="input" value={form.receiptLink} onChange={(e) => set('receiptLink', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Notes" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Transaction'} onCancel={onCancel} />
    </form>
  );
}
