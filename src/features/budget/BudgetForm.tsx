import React, { useState } from 'react';
import { Budget } from '../../types';
import { generateId } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';

interface Props {
  projectId: string;
  initial?: Budget;
  onSave: (b: Budget) => void;
  onCancel: () => void;
}

export default function BudgetForm({ projectId, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    expectedIncome: initial?.expectedIncome ?? 0,
    expectedExpense: initial?.expectedExpense ?? 0,
    confirmedIncome: initial?.confirmedIncome ?? 0,
    confirmedExpense: initial?.confirmedExpense ?? 0,
    notes: initial?.notes ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      projectId,
      expectedIncome: Number(form.expectedIncome) || 0,
      expectedExpense: Number(form.expectedExpense) || 0,
      confirmedIncome: Number(form.confirmedIncome) || 0,
      confirmedExpense: Number(form.confirmedExpense) || 0,
      notes: form.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected Income (Rs)">
          <input className="input" type="number" min={0} value={form.expectedIncome} onChange={(e) => set('expectedIncome', Number(e.target.value))} />
        </Field>
        <Field label="Expected Expense (Rs)">
          <input className="input" type="number" min={0} value={form.expectedExpense} onChange={(e) => set('expectedExpense', Number(e.target.value))} />
        </Field>
        <Field label="Confirmed Income (Rs)">
          <input className="input" type="number" min={0} value={form.confirmedIncome} onChange={(e) => set('confirmedIncome', Number(e.target.value))} />
        </Field>
        <Field label="Confirmed Expense (Rs)">
          <input className="input" type="number" min={0} value={form.confirmedExpense} onChange={(e) => set('confirmedExpense', Number(e.target.value))} />
        </Field>
        <Field label="Notes" className="col-span-2">
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
      <FormActions submitLabel="Save Budget" onCancel={onCancel} />
    </form>
  );
}
