import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Copy, Edit2, ExternalLink, Plus, Rocket, Search, Trash2 } from 'lucide-react';
import { PRApprovalStatus, PRItem, PRPlatform, PRPublishingStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getAllPRItems } from '../../lib/stats';
import { formatDate, isThisWeek } from '../../lib/dateUtils';
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
import PersonToken from '../../components/design/PersonToken';
import PRItemForm from '../pr/PRItemForm';

const PLATFORMS: (PRPlatform | 'All')[] = ['All', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

export default function LaunchesPage() {
  const { data, saveProject } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState<PRPlatform | 'All'>('All');
  const [prModal, setPrModal] = useState<{ open: boolean; editing?: PRItem & { projectId: string }; projectId?: string }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<{ projectId: string; pr: PRItem } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useAutoNew(() => setPrModal({ open: true, projectId: projects[0]?.id }));

  const allLaunches = getAllPRItems(projects);
  const filtered = useMemo(() => allLaunches
    .filter((launch) => {
      const matchSearch = launch.title.toLowerCase().includes(search.toLowerCase()) || launch.campaign.toLowerCase().includes(search.toLowerCase());
      const matchProject = projectFilter === 'All' || launch.projectId === projectFilter;
      const matchPlatform = platformFilter === 'All' || launch.platform === platformFilter;
      return matchSearch && matchProject && matchPlatform;
    })
    .sort((a, b) => (a.publishDate || '9999').localeCompare(b.publishDate || '9999')), [allLaunches, platformFilter, projectFilter, search]);

  const lanes = {
    Drafting: filtered.filter((launch) => launch.publishingStatus === 'Idea' || launch.publishingStatus === 'Designing'),
    'In Review': filtered.filter((launch) => launch.approvalStatus === 'Internal Review' || launch.approvalStatus === 'Teacher Review'),
    Ready: filtered.filter((launch) => launch.approvalStatus === 'Approved' && launch.publishingStatus !== 'Scheduled' && launch.publishingStatus !== 'Posted'),
    Scheduled: filtered.filter((launch) => launch.publishingStatus === 'Scheduled'),
    Posted: filtered.filter((launch) => launch.publishingStatus === 'Posted'),
  };
  const next14 = filtered.filter((launch) => isThisWeek(launch.publishDate) || (launch.publishDate && launch.publishDate >= new Date().toISOString().slice(0, 10))).slice(0, 8);

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

  function updateStatus(projectId: string, prId: string, field: 'approvalStatus' | 'publishingStatus', value: string) {
    const project = projects.find((current) => current.id === projectId);
    if (!project) return;
    saveProject({
      ...project,
      prItems: project.prItems.map((launch) => launch.id !== prId ? launch : field === 'approvalStatus'
        ? { ...launch, approvalStatus: value as PRApprovalStatus }
        : { ...launch, publishingStatus: value as PRPublishingStatus }),
    });
  }

  function copyCaption(launch: PRItem) {
    navigator.clipboard.writeText(launch.caption || '').then(() => {
      setCopiedId(launch.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Launches"
        description="Posts, reveals, captions, and public releases."
        tone="launch"
        primaryAction={<button className="btn-primary" onClick={() => setPrModal({ open: true, projectId: projects[0]?.id })} disabled={projects.length === 0}><Plus size={16} /> New Launch</button>}
        metrics={[
          { label: 'Needs Approval', value: lanes['In Review'].length, tone: 'warning' },
          { label: 'Ready', value: lanes.Ready.length, tone: 'success' },
          { label: 'Scheduled', value: lanes.Scheduled.length, tone: 'launch' },
          { label: 'Posted', value: lanes.Posted.length },
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
      </ContextActionBar>

      <Pipeline title="Publishing pipeline">
        {Object.entries(lanes).map(([lane, items]) => (
          <PipelineLane key={lane} title={lane} count={`${items.length} item${items.length === 1 ? '' : 's'}`}>
            {items.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">Nothing here</div>
            ) : (
              items.slice(0, 5).map((launch) => (
                <Card key={launch.id} className="space-y-2 p-3" onClick={() => setPrModal({ open: true, editing: launch, projectId: launch.projectId })}>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{launch.title}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{launch.projectName} · {launch.publishDate ? formatDate(launch.publishDate) : 'No date'}</div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={launch.approvalStatus} />
                    <StatusBadge status={launch.publishingStatus} />
                  </div>
                </Card>
              ))
            )}
          </PipelineLane>
        ))}
      </Pipeline>

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">Next 14 days</div>
        {next14.length === 0 ? (
          <EmptyMoment title="No launches on deck" description="Upcoming launch work will appear here once scheduled." />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {next14.map((launch) => (
              <Card key={launch.id} className="min-w-[260px] p-4" onClick={() => setPrModal({ open: true, editing: launch, projectId: launch.projectId })}>
                <div className="text-xs text-[var(--text-tertiary)]">{launch.publishDate ? formatDate(launch.publishDate) : 'No date'}</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">{launch.title}</div>
                <div className="mt-1 text-xs text-[var(--text-tertiary)]">{launch.projectName} · {launch.platform}</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">Launch queue</div>
        {filtered.length === 0 ? (
          <EmptyMoment icon={<Rocket size={20} />} title="No launch items found" description="Create a launch when a poster, reveal, or announcement needs to go public." />
        ) : (
          <div className="space-y-3">
            {filtered.map((launch) => (
              <Card key={launch.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{launch.title}</div>
                      <StatusBadge status={launch.approvalStatus} />
                      <StatusBadge status={launch.publishingStatus} />
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{launch.projectName} · {launch.platform} · {launch.publishDate ? formatDate(launch.publishDate) : 'No date'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select className="select w-36 text-xs" value={launch.approvalStatus} onChange={(e) => updateStatus(launch.projectId, launch.id, 'approvalStatus', e.target.value)}>
                      {(['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'] as PRApprovalStatus[]).map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <select className="select w-32 text-xs" value={launch.publishingStatus} onChange={(e) => updateStatus(launch.projectId, launch.id, 'publishingStatus', e.target.value)}>
                      {(['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'] as PRPublishingStatus[]).map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <button className="btn-ghost p-1.5" onClick={() => setPrModal({ open: true, editing: launch, projectId: launch.projectId })}><Edit2 size={13} /></button>
                    <button className="btn-ghost p-1.5 text-[var(--danger)]" onClick={() => setConfirmDel({ projectId: launch.projectId, pr: launch })}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-4">
                  <PersonToken name={launch.designer || 'No designer'} detail="Designer" />
                  <PersonToken name={launch.captionWriter || 'No writer'} detail="Caption writer" />
                  <PersonToken name={launch.reviewer || 'No reviewer'} detail="Reviewer" />
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {launch.designLink ? <a href={launch.designLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--accent)]"><ExternalLink size={11} /> Open design</a> : 'No design link'}
                  </div>
                </div>
                {launch.caption && (
                  <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-black/10 px-3 py-3 text-sm text-[var(--text-secondary)]">
                    “{launch.caption}”
                    <button className="btn-ghost ml-3 text-xs" onClick={() => copyCaption(launch)}><Copy size={11} /> {copiedId === launch.id ? 'Copied' : 'Copy caption'}</button>
                  </div>
                )}
                {!launch.caption || !launch.designer || !launch.publishDate ? (
                  <div className="inline-flex items-center gap-1 text-xs text-[var(--warning)]"><AlertTriangle size={12} /> Missing setup details</div>
                ) : null}
              </Card>
            ))}
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
    </ScreenCanvas>
  );
}
