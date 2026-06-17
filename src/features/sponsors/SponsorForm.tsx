import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Sponsor, SponsorStage, PaymentStatus, SponsorDeliverable, SponsorDeliverableStatus, Project, Member } from '../../types';
import { generateId } from '../../lib/dateUtils';
import { Field, FormActions } from '../../components/Field';
import MemberSelect from '../../components/MemberSelect';

interface Props {
  initial?: Sponsor;
  projects: Project[];
  members: Member[];
  lockedProjectId?: string;
  onSave: (s: Sponsor) => void;
  onCancel: () => void;
}

const STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];
const PAYMENTS: PaymentStatus[] = ['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];
const DELIVERABLE_STATUSES: SponsorDeliverableStatus[] = ['Not Started', 'In Progress', 'Delivered', 'Cancelled'];

export default function SponsorForm({ initial, projects, members, lockedProjectId, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    projectId: lockedProjectId ?? initial?.projectId ?? projects[0]?.id ?? '',
    name: initial?.name ?? '',
    contactPerson: initial?.contactPerson ?? '',
    contactNumber: initial?.contactNumber ?? '',
    email: initial?.email ?? '',
    packageName: initial?.packageName ?? '',
    amount: initial?.amount ?? 0,
    stage: (initial?.stage ?? 'Lead') as SponsorStage,
    assignedMember: initial?.assignedMember ?? '',
    assignedMemberId: initial?.assignedMemberId ?? '',
    lastContactedDate: initial?.lastContactedDate ?? '',
    nextFollowUpDate: initial?.nextFollowUpDate ?? '',
    proposalLink: initial?.proposalLink ?? '',
    agreementLink: initial?.agreementLink ?? '',
    paymentStatus: (initial?.paymentStatus ?? 'Not Requested') as PaymentStatus,
    notes: initial?.notes ?? '',
  });
  const [deliverables, setDeliverables] = useState<SponsorDeliverable[]>(initial?.deliverables ?? []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const activeStages: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating'];
  const warnNoFollowUp = activeStages.includes(form.stage) && !form.nextFollowUpDate;
  const warnNoPackage = !form.packageName.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      projectId: form.projectId,
      name: form.name,
      contactPerson: form.contactPerson,
      contactNumber: form.contactNumber || undefined,
      email: form.email || undefined,
      packageName: form.packageName,
      amount: Number(form.amount) || 0,
      stage: form.stage,
      assignedMember: form.assignedMember,
      assignedMemberId: form.assignedMemberId || undefined,
      lastContactedDate: form.lastContactedDate || undefined,
      nextFollowUpDate: form.nextFollowUpDate || undefined,
      proposalLink: form.proposalLink || undefined,
      agreementLink: form.agreementLink || undefined,
      paymentStatus: form.paymentStatus,
      deliverables: deliverables.filter((d) => d.title.trim()),
      notes: form.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Sponsor Name" required className="col-span-2">
          <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. CodeGen" />
        </Field>
        <Field label="Project">
          <select className="select" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!lockedProjectId}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Package">
          <input className="input" value={form.packageName} onChange={(e) => set('packageName', e.target.value)} placeholder="e.g. Platinum Sponsor" />
        </Field>
        <Field label="Amount (Rs)">
          <input className="input" type="number" min={0} value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} />
        </Field>
        <Field label="Assigned RCCS Member">
          <MemberSelect
            members={members}
            value={form.assignedMemberId}
            onChange={(id, name) => setForm((f) => ({ ...f, assignedMemberId: id, assignedMember: name }))}
            placeholder="Select member…"
          />
        </Field>
        <Field label="Stage">
          <select className="select" value={form.stage} onChange={(e) => set('stage', e.target.value as SponsorStage)}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Payment Status">
          <select className="select" value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value as PaymentStatus)}>
            {PAYMENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Contact Person" hint="External company contact (not an RCCS member)">
          <input className="input" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
        </Field>
        <Field label="Contact Number">
          <input className="input" value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Last Contacted">
          <input className="input" type="date" value={form.lastContactedDate} onChange={(e) => set('lastContactedDate', e.target.value)} />
        </Field>
        <Field label="Next Follow-up">
          <input className="input" type="date" value={form.nextFollowUpDate} onChange={(e) => set('nextFollowUpDate', e.target.value)} />
        </Field>
        <Field label="Proposal Link">
          <input className="input" value={form.proposalLink} onChange={(e) => set('proposalLink', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Agreement Link">
          <input className="input" value={form.agreementLink} onChange={(e) => set('agreementLink', e.target.value)} placeholder="https://..." />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Deliverables</label>
          <button
            type="button"
            className="btn-ghost text-xs px-2 py-1"
            onClick={() => setDeliverables((d) => [...d, { id: generateId(), title: '', status: 'Not Started' }])}
          >
            <Plus size={13} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {deliverables.map((d, i) => (
            <div key={d.id} className="flex gap-2 flex-wrap">
              <input className="input flex-1 min-w-40" placeholder="Deliverable" value={d.title} onChange={(e) => setDeliverables((arr) => arr.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
              <input className="input w-36" type="date" value={d.dueDate ?? ''} onChange={(e) => setDeliverables((arr) => arr.map((x, idx) => idx === i ? { ...x, dueDate: e.target.value } : x))} />
              <select className="select w-32" value={d.status} onChange={(e) => setDeliverables((arr) => arr.map((x, idx) => idx === i ? { ...x, status: e.target.value as SponsorDeliverableStatus } : x))}>
                {DELIVERABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button type="button" className="btn-ghost p-2 text-red-500" onClick={() => setDeliverables((arr) => arr.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {deliverables.length === 0 && <p className="text-xs text-slate-600">No deliverables tracked.</p>}
        </div>
      </div>

      <Field label="Notes">
        <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      {(warnNoFollowUp || warnNoPackage) && (
        <div className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2 space-y-0.5">
          {warnNoPackage && <p>⚠ Package name is empty — consider adding a sponsorship tier.</p>}
          {warnNoFollowUp && <p>⚠ No follow-up date set — add one to keep the pipeline moving.</p>}
        </div>
      )}
      <FormActions submitLabel={initial ? 'Save Changes' : 'Add Sponsor'} onCancel={onCancel} />
    </form>
  );
}
