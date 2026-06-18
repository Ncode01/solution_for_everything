import React, { useMemo, useState } from 'react';
import { Plus, CheckSquare, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { ApprovalRequest, ApprovalStageStatus, ApprovalStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import {
  countStagesWaiting,
  deriveApprovalFromStages,
  ensureApprovalStages,
  getApprovalTypeOptions,
  getCurrentStage,
  getStageProgress,
  normalizeApprovalTypeLabel,
  updateStageStatus,
} from '../../lib/approvalStages';
import StatusBadge from '../../components/StatusBadge';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ApprovalForm from './ApprovalForm';
import { formatDate } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import ViewAllButton from '../../components/layout/ViewAllButton';

const STATUSES: ApprovalStatus[] = ['Draft', 'Submitted', 'Changes Requested', 'Approved', 'Rejected'];

function StageTimeline({ stages }: { stages: ReturnType<typeof ensureApprovalStages> }) {
  const current = getCurrentStage(stages);
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {stages.map((stage) => {
        const isActive = stage.id === current?.id;
        const done = stage.status === 'Approved' || stage.status === 'Skipped';
        const dotColor = stage.status === 'Rejected' ? 'bg-red-500'
          : stage.status === 'Changes Requested' ? 'bg-amber-500'
          : done ? 'bg-emerald-500'
          : isActive ? 'bg-blue-500 ring-2 ring-blue-400/50'
          : 'bg-slate-600';
        return (
          <div key={stage.id} className="flex items-center gap-1" title={`${stage.title}: ${stage.status}`}>
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
            <span className={`text-[10px] max-w-[72px] truncate ${isActive ? 'text-blue-300 font-medium' : 'text-slate-500'}`}>{stage.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ApprovalsPage() {
  const { data, saveApproval, deleteApproval } = useAppData();
  const { approvals, projects } = data;
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'All'>('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: ApprovalRequest }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<ApprovalRequest | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useAutoNew(() => setFormModal({ open: true }));

  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name ?? '—' : 'General');

  const enriched = useMemo(() => approvals.map((a) => {
    const stages = ensureApprovalStages(a);
    return { ...a, stages, progress: getStageProgress(stages), current: getCurrentStage(stages) };
  }), [approvals]);

  const filtered = enriched
    .filter((a) => (statusFilter === 'All' || a.status === statusFilter)
      && (projectFilter === 'All' || a.projectId === projectFilter)
      && (typeFilter === 'All' || normalizeApprovalTypeLabel(a.relatedType) === typeFilter))
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

  const pendingProcesses = enriched.filter((a) => a.status === 'Submitted' || a.status === 'Changes Requested').length;
  const stagesWaiting = enriched.reduce((sum, a) => sum + countStagesWaiting(a.stages), 0);
  const changesRequested = enriched.filter((a) => a.status === 'Changes Requested').length;
  const completed = enriched.filter((a) => a.status === 'Approved').length;

  function quickStageUpdate(approval: ApprovalRequest, stageId: string, status: ApprovalStageStatus) {
    const stages = updateStageStatus(ensureApprovalStages(approval), stageId, status);
    saveApproval(deriveApprovalFromStages(approval, stages));
  }

  function quickCurrentStage(approval: ApprovalRequest, status: ApprovalStageStatus) {
    const current = getCurrentStage(ensureApprovalStages(approval));
    if (!current) return;
    quickStageUpdate(approval, current.id, status);
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Approvals"
        description="Track letters, project approvals, budgets, permissions, and external sign-offs."
        primaryAction={<button onClick={() => setFormModal({ open: true })} className="btn-primary"><Plus size={16} /> New Request</button>}
        metrics={[
          { label: 'Pending Processes', value: pendingProcesses, tone: pendingProcesses > 0 ? 'warning' : 'default' },
          { label: 'Stages Waiting', value: stagesWaiting, tone: stagesWaiting > 0 ? 'warning' : 'default' },
          { label: 'Changes Requested', value: changesRequested, tone: changesRequested > 0 ? 'danger' : 'default' },
          { label: 'Completed', value: completed, tone: 'success' },
        ]}
      />

      <ContextActionBar>
        <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'All')}>
          <option value="All">All status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-48" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select w-52" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All approval types</option>
          {getApprovalTypeOptions().map((t) => <option key={t}>{t}</option>)}
        </select>
      </ContextActionBar>

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">Ongoing approval processes</div>
        {filtered.length === 0 ? (
          <EmptyMoment icon={<CheckSquare size={20} />} title="No approval requests" description="Create a request when something needs sign-off." action={<button onClick={() => setFormModal({ open: true })} className="btn-primary">New Request</button>} />
        ) : (
          <div className="space-y-3">
            {(expanded ? filtered : filtered.slice(0, 6)).map((a) => (
              <Card key={a.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm text-[var(--text-primary)]">{a.title}</h3>
                      <StatusBadge status={a.status} />
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        {normalizeApprovalTypeLabel(a.relatedType)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {projectName(a.projectId)} · Requested by {a.requestedBy || '—'} · Owner {a.approver || '—'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Current: {a.current?.title ?? '—'} · Progress {a.progress.completed}/{a.progress.total}
                    </p>
                    <StageTimeline stages={a.stages} />
                    <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mt-1.5 flex-wrap">
                      <span>Submitted {formatDate(a.submittedDate)}</span>
                      {a.decisionDate && <span>Decided {formatDate(a.decisionDate)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {a.current && a.status !== 'Approved' && a.status !== 'Rejected' && (
                      <div className="flex flex-wrap gap-1">
                        <button className="btn-primary text-xs px-2 py-1" onClick={() => quickCurrentStage(a, 'Approved')}>Approve current stage</button>
                        <button className="btn-secondary text-xs px-2 py-1" onClick={() => quickCurrentStage(a, 'Changes Requested')}>Changes</button>
                        <button className="btn-ghost text-xs px-2 py-1 text-[var(--danger)]" onClick={() => quickCurrentStage(a, 'Rejected')}>Reject</button>
                      </div>
                    )}
                    <div className="relative">
                      <button className="btn-ghost p-2" onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}><MoreHorizontal size={15} /></button>
                      {openMenuId === a.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1 shadow-lg">
                          <button className="block w-full px-3 py-2 text-left text-xs hover:bg-white/5" onClick={() => { setFormModal({ open: true, editing: a }); setOpenMenuId(null); }}><Edit2 size={12} className="inline mr-2" />Edit process</button>
                          <button className="block w-full px-3 py-2 text-left text-xs text-[var(--danger)] hover:bg-white/5" onClick={() => { setConfirmDel(a); setOpenMenuId(null); }}><Trash2 size={12} className="inline mr-2" />Delete process</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length > 6 && <ViewAllButton count={filtered.length} label={expanded ? 'Collapse' : `+${filtered.length - 6} more`} compact onClick={() => setExpanded((current) => !current)} />}
          </div>
        )}
      </section>

      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit Approval Process' : 'New Approval Request'} size="lg">
        <ApprovalForm
          initial={formModal.editing}
          projects={projects}
          members={data.members}
          onSave={(item) => { saveApproval(item); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete approval request?"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteApproval(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </ScreenCanvas>
  );
}
