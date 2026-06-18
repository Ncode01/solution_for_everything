import React, { useMemo, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Search } from 'lucide-react';
import { PRItem, PRPlatform, PRWorkflowStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import { getAllPRItems } from '../../lib/stats';
import {
  DISPLAY_LANES,
  DisplayLane,
  getMissingChips,
  getPRWorkflowStatus,
  isAssignedDesigner,
  isChairmanOrSecretary,
  laneForStatus,
  syncLegacyFromWorkflow,
  validateWorkflowTransition,
} from '../../lib/prWorkflow';
import { resolveMemberForUser } from '../../lib/people';
import { formatDate } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';
import PRItemForm from '../pr/PRItemForm';

const PLATFORMS: (PRPlatform | 'All')[] = ['All', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

type LaunchRow = PRItem & { projectName: string; projectId: string };

export default function LaunchesPage() {
  const { user } = useAuth();
  const { data, saveProject } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState<PRPlatform | 'All'>('All');
  const [laneFilter, setLaneFilter] = useState<DisplayLane | 'All'>('All');
  const [showArchive, setShowArchive] = useState(false);
  const [prModal, setPrModal] = useState<{ open: boolean; editing?: LaunchRow; projectId?: string }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<{ projectId: string; pr: PRItem } | null>(null);
  const [confirmPost, setConfirmPost] = useState<LaunchRow | null>(null);
  const [actionError, setActionError] = useState('');

  useAutoNew(() => setPrModal({ open: true, projectId: projects[0]?.id }));

  const myMember = useMemo(() => resolveMemberForUser(user, data.members) ?? undefined, [data.members, user]);

  const allLaunches = getAllPRItems(projects);
  const filtered = useMemo(() => allLaunches
    .filter((launch) => {
      const status = getPRWorkflowStatus(launch);
      const archived = ['Posted', 'Archived'].includes(status);
      const lane = laneForStatus(status);
      const term = search.toLowerCase();
      const matchSearch = launch.title.toLowerCase().includes(term) || launch.campaign.toLowerCase().includes(term);
      const matchProject = projectFilter === 'All' || launch.projectId === projectFilter;
      const matchPlatform = platformFilter === 'All' || launch.platform === platformFilter;
      const matchLane = laneFilter === 'All' || lane === laneFilter;
      const matchArchive = showArchive || !archived;
      return matchSearch && matchProject && matchPlatform && matchLane && matchArchive;
    })
    .sort((a, b) => (a.publishDate || '9999-12-31').localeCompare(b.publishDate || '9999-12-31')), [allLaunches, laneFilter, platformFilter, projectFilter, search, showArchive]);

  const metrics = useMemo(() => {
    const active = allLaunches.filter((launch) => !['Posted', 'Archived'].includes(getPRWorkflowStatus(launch)));
    return {
      sent: active.filter((launch) => laneForStatus(getPRWorkflowStatus(launch)) === 'Sent to Designer').length,
      approval: active.filter((launch) => laneForStatus(getPRWorkflowStatus(launch)) === 'Under Approval').length,
      ready: active.filter((launch) => laneForStatus(getPRWorkflowStatus(launch)) === 'Ready to Share').length,
      archived: allLaunches.filter((launch) => ['Posted', 'Archived'].includes(getPRWorkflowStatus(launch))).length,
    };
  }, [allLaunches]);

  const lanes = useMemo(() => {
    const map = DISPLAY_LANES.reduce((acc, lane) => {
      acc[lane] = [];
      return acc;
    }, {} as Record<DisplayLane, LaunchRow[]>);
    filtered.forEach((launch) => {
      map[laneForStatus(getPRWorkflowStatus(launch))].push(launch);
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
    setActionError('');
    const err = validateWorkflowTransition(launch, next);
    if (err) {
      setActionError(err);
      setPrModal({ open: true, editing: launch, projectId: launch.projectId });
      return;
    }
    const now = new Date().toISOString();
    let updated = syncLegacyFromWorkflow({ ...launch }, next);
    if (next === 'Designing' && getPRWorkflowStatus(launch) === 'Sent to Designer') updated.designerAcceptedAt = now;
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

  function primaryAction(launch: LaunchRow): { label: string; action: () => void; disabled?: boolean; hint?: string } | null {
    const status = getPRWorkflowStatus(launch);
    const isDesigner = isAssignedDesigner(launch, myMember);
    const canApprove = isChairmanOrSecretary(myMember);

    switch (status) {
      case 'Draft':
        return { label: 'Send to Designer', action: () => transition(launch, 'Sent to Designer') };
      case 'Sent to Designer':
        if (!isDesigner) return { label: 'Waiting for Designer', action: () => {}, disabled: true, hint: 'Assigned designer only' };
        return { label: 'Accept', action: () => transition(launch, 'Designer Accepted') };
      case 'Designer Accepted':
        return { label: 'Start Design', action: () => transition(launch, 'Designing') };
      case 'Designing':
        if (!isDesigner) return { label: 'Designer Working', action: () => {}, disabled: true, hint: 'Assigned designer only' };
        return { label: 'Submit Design', action: () => transition(launch, 'Design Submitted') };
      case 'Design Submitted':
        return { label: 'Send to Approval', action: () => transition(launch, 'In Approval') };
      case 'Changes Requested':
        if (!isDesigner) return { label: 'Changes Requested', action: () => {}, disabled: true, hint: 'Assigned designer only' };
        return { label: 'Resume Design', action: () => transition(launch, 'Designing') };
      case 'In Approval':
        if (!canApprove) return { label: 'Awaiting Approval', action: () => {}, disabled: true, hint: 'Chairman or Secretary only' };
        return { label: 'Approve', action: () => transition(launch, 'Ready to Launch') };
      case 'Ready to Launch':
        return { label: 'Schedule', action: () => transition(launch, 'Scheduled') };
      case 'Scheduled':
        return { label: 'Mark Shared', action: () => setConfirmPost(launch) };
      default:
        return null;
    }
  }

  function renderLaunchCard(launch: LaunchRow) {
    const status = getPRWorkflowStatus(launch);
    const chips = getMissingChips(launch);
    const action = primaryAction(launch);

    return (
      <Card key={launch.id} className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)]">{launch.title}</div>
            <div className="mt-1 text-xs text-[var(--text-tertiary)]">
              {launch.projectName} · {launch.publishDate ? formatDate(launch.publishDate) : 'No publish date'}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
          <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2 py-1">{launch.platform}</span>
          <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2 py-1">{launch.designer || 'No designer'}</span>
          {launch.captionWriter ? <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2 py-1">{launch.captionWriter}</span> : null}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-200">
                <AlertTriangle size={10} />
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {action ? (
            <button
              className={`btn-primary text-xs px-3 py-1.5 ${action.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              disabled={action.disabled}
              title={action.hint}
              onClick={() => !action.disabled && action.action()}
            >
              {action.label}
            </button>
          ) : null}
          {status === 'In Approval' && isChairmanOrSecretary(myMember) ? (
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => transition(launch, 'Changes Requested')}>
              Request Changes
            </button>
          ) : null}
          <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setPrModal({ open: true, editing: launch, projectId: launch.projectId })}>
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
        description="A tighter production board with only the three stages the team actually manages day to day."
        tone="launch"
        primaryAction={<button className="btn-primary" onClick={() => setPrModal({ open: true, projectId: projects[0]?.id })} disabled={projects.length === 0}><Plus size={16} /> New Launch</button>}
        metrics={[
          { label: 'Sent to Designer', value: metrics.sent, tone: 'warning' },
          { label: 'Under Approval', value: metrics.approval, tone: 'warning' },
          { label: 'Ready to Share', value: metrics.ready, tone: 'success' },
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
        <select className="select w-44" value={laneFilter} onChange={(e) => setLaneFilter(e.target.value as DisplayLane | 'All')}>
          <option value="All">All lanes</option>
          {DISPLAY_LANES.map((lane) => <option key={lane}>{lane}</option>)}
        </select>
        <button className={`btn-secondary text-xs ${showArchive ? 'ring-1 ring-[var(--accent)]' : ''}`} onClick={() => setShowArchive((current) => !current)}>
          Archive ({metrics.archived})
        </button>
      </ContextActionBar>

      {actionError ? (
        <div className="rounded-[var(--radius-lg)] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {DISPLAY_LANES.map((lane) => {
          const items = lanes[lane] ?? [];
          return (
            <div key={lane} className="solid-panel overflow-hidden rounded-[var(--radius-xl)]">
              <div className="border-b border-[var(--border-hairline)] px-4 py-3 md:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-[var(--text-primary)]">{lane}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-3">
                {items.length === 0 ? (
                  <EmptyMoment title={`Nothing in ${lane.toLowerCase()}`} description="This lane is clear right now." />
                ) : (
                  items.map((launch) => renderLaunchCard(launch))
                )}
              </div>
            </div>
          );
        })}
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
          title="Mark as shared?"
          message="Mark this launch item as shared and move it to archive?"
          confirmLabel="Share & Archive"
          onConfirm={() => markPosted(confirmPost)}
          onCancel={() => setConfirmPost(null)}
        />
      )}
    </ScreenCanvas>
  );
}
