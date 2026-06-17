import React, { useState } from 'react';
import { Plus, Search, ExternalLink, Edit2, Trash2, Megaphone, Copy, AlertTriangle, Send, Clock } from 'lucide-react';
import { PRItem, PRApprovalStatus, PRPublishingStatus, PRPlatform } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import PRItemForm from './PRItemForm';
import { formatDate, isThisWeek } from '../../lib/dateUtils';
import { getAllPRItems } from '../../lib/stats';
import { useAutoNew } from '../../lib/useAutoNew';

const PLATFORMS: (PRPlatform | 'All')[] = ['All', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Website', 'YouTube', 'Email'];

function missingFields(pr: PRItem): string[] {
  const missing: string[] = [];
  if (!pr.caption.trim()) missing.push('caption');
  if (!pr.designer.trim()) missing.push('designer');
  if (!pr.publishDate) missing.push('publish date');
  if (!pr.publishTime) missing.push('publish time');
  return missing;
}

export default function PRPlannerPage() {
  const { data, saveProject } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState<PRPlatform | 'All'>('All');
  const [approvalFilter, setApprovalFilter] = useState<PRApprovalStatus | 'All'>('All');
  const [publishFilter, setPublishFilter] = useState<PRPublishingStatus | 'All'>('All');
  const [prModal, setPrModal] = useState<{ open: boolean; editing?: PRItem & { projectId: string }; projectId?: string }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<{ projectId: string; pr: PRItem } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useAutoNew(() => setPrModal({ open: true, projectId: projects[0]?.id }));

  const allPRItems = getAllPRItems(projects);

  function savePR(projectId: string, item: PRItem) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const prItems = project.prItems.some((x) => x.id === item.id)
      ? project.prItems.map((x) => (x.id === item.id ? item : x))
      : [...project.prItems, item];
    saveProject({ ...project, prItems });
  }
  function deletePR(projectId: string, prId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    saveProject({ ...project, prItems: project.prItems.filter((x) => x.id !== prId) });
  }
  function updateStatus(projectId: string, prId: string, field: 'approvalStatus' | 'publishingStatus', value: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    saveProject({
      ...project,
      prItems: project.prItems.map((pr) =>
        pr.id !== prId ? pr : field === 'approvalStatus'
          ? { ...pr, approvalStatus: value as PRApprovalStatus }
          : { ...pr, publishingStatus: value as PRPublishingStatus }
      ),
    });
  }

  function copyCaption(pr: PRItem) {
    navigator.clipboard?.writeText(pr.caption || '').then(() => {
      setCopiedId(pr.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const filtered = allPRItems.filter((pr) => {
    const matchSearch = pr.title.toLowerCase().includes(search.toLowerCase()) || pr.campaign.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === 'All' || pr.projectId === projectFilter;
    const matchPlatform = platformFilter === 'All' || pr.platform === platformFilter;
    const matchApproval = approvalFilter === 'All' || pr.approvalStatus === approvalFilter;
    const matchPublish = publishFilter === 'All' || pr.publishingStatus === publishFilter;
    return matchSearch && matchProject && matchPlatform && matchApproval && matchPublish;
  }).sort((a, b) => new Date(a.publishDate || '2999').getTime() - new Date(b.publishDate || '2999').getTime());

  const needsApproval = allPRItems.filter((pr) => pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review');
  const readyToPost = allPRItems.filter((pr) => pr.approvalStatus === 'Approved' && pr.publishingStatus !== 'Posted' && pr.publishingStatus !== 'Archived');
  const thisWeek = allPRItems.filter((pr) => isThisWeek(pr.publishDate) && pr.publishingStatus !== 'Posted');

  function MiniCard({ pr, accent }: { pr: PRItem & { projectName: string }; accent: string }) {
    return (
      <button onClick={() => setPrModal({ open: true, editing: pr, projectId: pr.projectId })} className={`w-full text-left bg-slate-900 border border-slate-800 border-l-2 ${accent} rounded-lg px-3 py-2 hover:border-slate-700 transition-colors`}>
        <p className="text-sm text-slate-200 truncate">{pr.title}</p>
        <p className="text-xs text-slate-500 truncate">{pr.projectName} · {pr.publishDate ? formatDate(pr.publishDate) : 'No date'}</p>
      </button>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="PR Planner"
        description={`${allPRItems.length} posts across all projects. Track what's ready, pending, and missing.`}
        actions={
          <button className="btn-primary" onClick={() => setPrModal({ open: true, projectId: projects[0]?.id })} disabled={projects.length === 0}>
            <Plus size={16} /> New PR Item
          </button>
        }
      />

      {/* Operational sections */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <SectionHeader title="Needs approval" icon={AlertTriangle} tone="warning" count={needsApproval.length} />
          <div className="space-y-2">
            {needsApproval.slice(0, 4).map((pr) => <MiniCard key={pr.id} pr={pr} accent="border-l-amber-500" />)}
            {needsApproval.length === 0 && <p className="text-xs text-slate-600">Nothing waiting for approval.</p>}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Ready to post" icon={Send} count={readyToPost.length} />
          <div className="space-y-2">
            {readyToPost.slice(0, 4).map((pr) => <MiniCard key={pr.id} pr={pr} accent="border-l-emerald-500" />)}
            {readyToPost.length === 0 && <p className="text-xs text-slate-600">Nothing approved & pending post.</p>}
          </div>
        </Card>
        <Card>
          <SectionHeader title="This week" icon={Clock} count={thisWeek.length} />
          <div className="space-y-2">
            {thisWeek.slice(0, 4).map((pr) => <MiniCard key={pr.id} pr={pr} accent="border-l-blue-500" />)}
            {thisWeek.length === 0 && <p className="text-xs text-slate-600">No posts scheduled this week.</p>}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search PR items..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select w-32" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as PRPlatform | 'All')}>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="select w-40" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value as PRApprovalStatus | 'All')}>
          <option value="All">All Approval</option>
          {(['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'] as PRApprovalStatus[]).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-32" value={publishFilter} onChange={(e) => setPublishFilter(e.target.value as PRPublishingStatus | 'All')}>
          <option value="All">All Publish</option>
          {(['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'] as PRPublishingStatus[]).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No PR items found" description="Try adjusting filters or add a new PR item." />
      ) : (
        <div className="space-y-3">
          {filtered.map((pr) => {
            const proj = projects.find((p) => p.id === pr.projectId);
            const missing = missingFields(pr);
            return (
              <Card key={pr.id}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{pr.title}</h3>
                      <StatusBadge status={pr.approvalStatus} />
                      <StatusBadge status={pr.publishingStatus} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="text-blue-400">{proj?.name ?? pr.projectId}</span>
                      <span>{pr.platform}</span>
                      {pr.campaign && <span>· {pr.campaign}</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-500 mt-2">
                      <span>{pr.publishDate ? formatDate(pr.publishDate) : 'No date'} {pr.publishTime}</span>
                      <span>Designer: {pr.designer || '—'}</span>
                      <span>Caption: {pr.captionWriter || '—'}</span>
                      <span>Reviewer: {pr.reviewer || '—'}</span>
                    </div>
                    {pr.caption && <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">"{pr.caption}"</p>}
                    {missing.length > 0 && (
                      <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> Missing: {missing.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {pr.caption && (
                        <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1" onClick={() => copyCaption(pr)}>
                          <Copy size={11} /> {copiedId === pr.id ? 'Copied!' : 'Copy caption'}
                        </button>
                      )}
                      {pr.designLink && (
                        <a href={pr.designLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1">
                          <ExternalLink size={11} /> Open design
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <select className="select text-xs py-1 w-36" value={pr.approvalStatus} onChange={(e) => updateStatus(pr.projectId, pr.id, 'approvalStatus', e.target.value)}>
                      {(['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'] as PRApprovalStatus[]).map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <select className="select text-xs py-1 w-28" value={pr.publishingStatus} onChange={(e) => updateStatus(pr.projectId, pr.id, 'publishingStatus', e.target.value)}>
                      {(['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'] as PRPublishingStatus[]).map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button className="btn-ghost p-1.5" onClick={() => setPrModal({ open: true, editing: pr, projectId: pr.projectId })}><Edit2 size={13} /></button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel({ projectId: pr.projectId, pr })}><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={prModal.open} onClose={() => setPrModal({ open: false })} title={prModal.editing ? 'Edit PR Item' : 'New PR Item'} size="lg">
        {prModal.open && (
          <>
            {!prModal.editing && (
              <div className="mb-4">
                <label className="label">Project *</label>
                <select className="select" value={prModal.projectId ?? ''} onChange={(e) => setPrModal((m) => ({ ...m, projectId: e.target.value }))}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <PRItemForm
              projectId={prModal.editing?.projectId ?? prModal.projectId ?? projects[0]?.id ?? ''}
              members={data.members}
              initial={prModal.editing}
              onSave={(item) => {
                const targetProjectId = prModal.editing?.projectId ?? prModal.projectId ?? projects[0]?.id ?? '';
                if (targetProjectId) savePR(targetProjectId, item);
                setPrModal({ open: false });
              }}
              onCancel={() => setPrModal({ open: false })}
            />
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete PR item?"
        message={`Delete "${confirmDel?.pr.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deletePR(confirmDel.projectId, confirmDel.pr.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
