import React, { useMemo, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Rocket, Search, Trash2 } from 'lucide-react';
import { PRItem, PRPlatform, PRWorkflowStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getAllPRItems } from '../../lib/stats';
import {
  getMissingChips,
  getPRWorkflowStatus,
  laneForStatus,
  syncLegacyFromWorkflow,
  validateWorkflowTransition,
  WORKFLOW_LANES,
} from '../../lib/prWorkflow';
import { formatDate } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import Pipeline from '../../components/layout/Pipeline';
import PipelineLane from '../../components/layout/PipelineLane';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';
import PRItemForm from '../pr/PRItemForm';

const PLATFORMS: (PRPlatform | 'All')[] = ['All', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

type LaunchRow = PRItem & { projectName: string; projectId: string };

export default function LaunchesPage() {
  const { data, saveProject } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState<PRPlatform | 'All'>('All');
  const [workflowFilter, setWorkflowFilter] = useState<PRWorkflowStatus | 'All'>('All');
  const [showArchive, setShowArchive] = useState(false);
  const [prModal, setPrModal] = useState<{ open: boolean; editing?: LaunchRow; projectId?: string }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<{ projectId: string; pr: PRItem } | null>(null);
  const [confirmPost, setConfirmPost] = useState<LaunchRow | null>(null);

  useAutoNew(() => setPrModal({ open: true, projectId: projects[0]?.id }));

  const allLaunches = getAllPRItems(projects);
  const filtered = useMemo(() => allLaunches
    .filter((launch) => {
      const status = getPRWorkflowStatus(launch);
      const matchSearch = launch.title.toLowerCase().includes(search.toLowerCase()) || launch.campaign.toLowerCase().includes(search.toLowerCase());
      const matchProject = projectFilter === 'All' || launch.projectId === projectFilter;
      const matchPlatform = platformFilter === 'All' || launch.platform === platformFilter;
      const matchWorkflow = workflowFilter === 'All' || status === workflowFilter;
      const matchArchive = showArchive || laneForStatus(status) !== 'Archived';
      return matchSearch && matchProject && matchPlatform && matchWorkflow && matchArchive;
    })
    .sort((a, b) => (a.publishDate || '9999').localeCompare(b.publishDate || '9999')), [allLaunches, platformFilter, projectFilter, search, showArchive, workflowFilter]);

  const metrics = useMemo(() => {
    const active = allLaunches.filter((l) => laneForStatus(getPRWorkflowStatus(l)) !== 'Archived');
    return {
      drafts: active.filter((l) => getPRWorkflowStatus(l) === 'Draft').length,
      withDesigner: active.filter((l) => ['Sent to Designer', 'Designer Accepted', 'Designing'].includes(getPRWorkflowStatus(l))).length,
      inApproval: active.filter((l) => ['In Approval', 'Changes Requested', 'Design Submitted'].includes(getPRWorkflowStatus(l))).length,
      ready: active.filter((l) => ['Ready to Launch', 'Scheduled'].includes(getPRWorkflowStatus(l))).length,
      archived: allLaunches.filter((l) => laneForStatus(getPRWorkflowStatus(l)) === 'Archived').length,
    };
  }, [allLaunches]);

  const lanes = useMemo(() => {
    const map: Record<string, LaunchRow[]> = {};
    WORKFLOW_LANES.forEach((lane) => { map[lane] = []; });
    filtered.forEach((launch) => {
      const lane = laneForStatus(getPRWorkflowStatus(launch));
      map[lane].push(launch);
    });
    return map;
  }, [filtered]);

  function savePR(projectId: string, item: PRItem) {
    const project = projects.find((current) => current.id === projectId);
    if (!project) return;
    const prItems = project.prItems.some((existing) => existing.id === item.id)
      ? project.prItems.map((existing) => existing.id === item.id ? item : existing)
      : [...project.prItems, item];
    saveProject({ ...project, prItems });
  }

  function deletePR(projectId: string, prId: string) {
    const project = projects.find((current) => current.id === projectId);
    if (!project) return;
    saveProject({ ...project, prItems: project.prItems.filter((existing) => existing.id !== prId) });
  }

  function transition(launch: LaunchRow, next: PRWorkflowStatus) {
    const err = validateWorkflowTransition(launch, next);
    if (err) {
      setPrModal({ open: true, editing: launch, projectId: launch.projectId });
      return;
    }
    const now = new Date().toISOString();
    let updated = syncLegacyFromWorkflow({ ...launch }, next);
    if (next === 'Designer Accepted') updated.designerAcceptedAt = now;
    if (next === 'Design Submitted') updated.designSubmittedAt = now;
    if (next === 'In Approval') updated.approvalSubmittedAt = now;
    if (next === 'Ready to Launch') updated.approvedAt = now;
    savePR(launch.projectId, updated);
  }

  function markPosted(launch: LaunchRow) {
    const now = new Date().toISOString();
    const updated = syncLegacyFromWorkflow({
      ...launch,
      postedAt: launch.postedAt || now,
      archivedAt: now,
    }, 'Archived');
    savePR(launch.projectId, updated);
    setConfirmPost(null);
  }

  function primaryAction(launch: LaunchRow): { label: string; action: () => void } | null {
    const status = getPRWorkflowStatus(launch);
    switch (status) {
      case 'Draft': return { label: 'Send to Designer', action: () => transition(launch, 'Sent to Designer') };
      case 'Sent to Designer': return { label: 'Designer Accept', action: () => transition(launch, 'Designer Accepted') };
      case 'Designer Accepted': return { label: 'Start Designing', action: () => transition(launch, 'Designing') };
      case 'Designing': return { label: 'Submit Design', action: () => transition(launch, 'Design Submitted') };
      case 'Design Submitted': return { label: 'Send to Approval', action: () => transition(launch, 'In Approval') };
      case 'In Approval': return { label: 'Mark Approved', action: () => transition(launch, 'Ready to Launch') };
      case 'Changes Requested': return { label: 'Back to Designing', action: () => transition(launch, 'Designing') };
      case 'Ready to Launch': return { label: 'Schedule', action: () => transition(launch, 'Scheduled') };
      case 'Scheduled': return { label: 'Mark Posted', action: () => setConfirmPost(launch) };
      default: return null;
    }
  }

  function renderLaunchCard(launch: LaunchRow) {
    const status = getPRWorkflowStatus(launch);
    const chips = getMissingChips(launch);
    const action = primaryAction(launch);

    return (
      <Card key={launch.id} className="space-y-2 p-3">
        <div className="text-sm font-medium text-[var(--text-primary)]">{launch.title}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{launch.projectName} · {launch.publishDate ? formatDate(launch.publishDate) : 'No date'}</div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={status} />
          {launch.designer && <span className="text-[10px] text-[var(--text-tertiary)]">{launch.designer}</span>}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                <AlertTriangle size={9} /> {chip}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {action && (
            <button className="btn-primary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); action.action(); }}>
              {action.label}
            </button>
          )}
          {status === 'In Approval' && (
            <button className="btn-secondary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); transition(launch, 'Changes Requested'); }}>
              Changes Requested
            </button>
          )}
          <button className="btn-ghost text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); setPrModal({ open: true, editing: launch, projectId: launch.projectId }); }}>
            <Edit2 size={11} /> Edit
          </button>
        </div>
      </Card>
    );
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Launches"
        description="Design handoff, approval, and posting workflow for RCCS public releases."
        tone="launch"
        primaryAction={<button className="btn-primary" onClick={() => setPrModal({ open: true, projectId: projects[0]?.id })} disabled={projects.length === 0}><Plus size={16} /> New Launch</button>}
        metrics={[
          { label: 'Drafts', value: metrics.drafts },
          { label: 'With Designer', value: metrics.withDesigner, tone: 'warning' },
          { label: 'In Approval', value: metrics.inApproval, tone: 'warning' },
          { label: 'Ready', value: metrics.ready, tone: 'success' },
        ]}
      />

      <ContextActionBar>
        <div className="relative min-w-[15rem] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Search launches..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="select w-36" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as PRPlatform | 'All')}>
          {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
        </select>
        <select className="select w-40" value={workflowFilter} onChange={(e) => setWorkflowFilter(e.target.value as PRWorkflowStatus | 'All')}>
          <option value="All">All workflow</option>
          {WORKFLOW_LANES.map((lane) => <option key={lane}>{lane}</option>)}
        </select>
        <button className={`btn-secondary text-xs ${showArchive ? 'ring-1 ring-[var(--accent)]' : ''}`} onClick={() => setShowArchive((v) => !v)}>
          Archive ({metrics.archived})
        </button>
      </ContextActionBar>

      <Pipeline title="Design handoff pipeline">
        {WORKFLOW_LANES.map((lane) => {
          const items = lanes[lane] ?? [];
          return (
            <PipelineLane key={lane} title={lane} count={`${items.length} item${items.length === 1 ? '' : 's'}`}>
              {items.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">Nothing here</div>
              ) : (
                items.slice(0, 6).map((launch) => renderLaunchCard(launch))
              )}
            </PipelineLane>
          );
        })}
      </Pipeline>

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">All launches</div>
        {filtered.length === 0 ? (
          <EmptyMoment icon={<Rocket size={20} />} title="No launch items found" description="Create a launch when a poster, reveal, or announcement needs to go public." />
        ) : (
          <div className="space-y-2">
            {filtered.map((launch) => {
              const status = getPRWorkflowStatus(launch);
              const action = primaryAction(launch);
              return (
                <Card key={launch.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{launch.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">{launch.projectName} · {launch.platform} · {launch.designer || 'No designer'}</div>
                  </div>
                  <StatusBadge status={status} />
                  <div className="flex flex-wrap gap-2">
                    {action && <button className="btn-primary text-xs" onClick={action.action}>{action.label}</button>}
                    <button className="btn-ghost text-xs" onClick={() => setPrModal({ open: true, editing: launch, projectId: launch.projectId })}>Edit</button>
                    <button className="btn-ghost text-xs text-[var(--danger)]" onClick={() => setConfirmDel({ projectId: launch.projectId, pr: launch })}><Trash2 size={13} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {prModal.open && (
        <Modal open={prModal.open} title={prModal.editing ? 'Edit Launch' : 'New Launch'} onClose={() => setPrModal({ open: false })} size="lg">
          <PRItemForm
            projectId={prModal.editing?.projectId ?? prModal.projectId ?? projects[0]?.id ?? ''}
            members={data.members}
            initial={prModal.editing}
            onSave={(item) => {
              const projectId = prModal.editing?.projectId ?? prModal.projectId ?? projects[0]?.id ?? '';
              savePR(projectId, item);
              setPrModal({ open: false });
            }}
            onCancel={() => setPrModal({ open: false })}
          />
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          open={!!confirmDel}
          title="Delete launch?"
          message={`Delete "${confirmDel.pr.title}"? This cannot be undone.`}
          onConfirm={() => { deletePR(confirmDel.projectId, confirmDel.pr.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {confirmPost && (
        <ConfirmDialog
          open={!!confirmPost}
          title="Mark as posted?"
          message="Mark as posted and move to Archive?"
          confirmLabel="Post & Archive"
          onConfirm={() => markPosted(confirmPost)}
          onCancel={() => setConfirmPost(null)}
        />
      )}
    </ScreenCanvas>
  );
}
