import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Pin, PinOff, Plus, Search } from 'lucide-react';
import { Project, ProjectPriority, ProjectStatus } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getNextDeadlines, getProjectHealth } from '../../lib/stats';
import { resolveMemberName } from '../../components/MemberSelect';
import { formatDateShort } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';
import { applyProjectTemplate, ProjectTemplateId } from '../../lib/projectTemplates';
import Modal from '../../components/Modal';
import ProjectForm from './ProjectForm';
import ProgressBar from '../../components/ProgressBar';
import StatusBadge from '../../components/StatusBadge';
import StatusDot from '../../components/design/StatusDot';
import PersonToken from '../../components/design/PersonToken';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import ContextActionBar from '../../components/layout/ContextActionBar';
import Matrix from '../../components/layout/Matrix';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Card from '../../components/Card';

type SortKey = 'deadline' | 'priority' | 'status' | 'progress';

const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_ORDER: Record<string, number> = {
  'Event Week': 0, Active: 1, Planning: 2, Idea: 3, 'On Hold': 4, Completed: 5, Archived: 6,
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data, saveProject, saveDeliverable, saveEventDayItem } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [showForm, setShowForm] = useState(false);

  useAutoNew(() => setShowForm(true));

  const filtered = useMemo(() => projects.filter((project) => {
    const matchSearch = project.name.toLowerCase().includes(search.toLowerCase()) || project.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || project.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || project.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  }), [priorityFilter, projects, search, statusFilter]);

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    switch (sortKey) {
      case 'priority':
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      case 'status':
        return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      case 'progress':
        return b.progress - a.progress;
      case 'deadline':
      default: {
        const da = getNextDeadlines(a, 1)[0]?.date;
        const db = getNextDeadlines(b, 1)[0]?.date;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
      }
    }
  });

  const featured = sorted.filter((project) => project.pinned || ['Active', 'Event Week'].includes(project.status)).slice(0, 4);
  const activeCount = projects.filter((project) => ['Planning', 'Active', 'Event Week'].includes(project.status)).length;
  const atRiskCount = projects.filter((project) => getProjectHealth(project, data).label === 'At Risk').length;
  const eventWeekCount = projects.filter((project) => project.status === 'Event Week').length;
  const completedCount = projects.filter((project) => project.status === 'Completed').length;

  function togglePin(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    saveProject({ ...project, pinned: !project.pinned });
  }

  function matrixCell(project: Project, value: number, tone: 'emerald' | 'amber' | 'red' | 'blue' | 'neutral') {
    return <StatusDot label={String(value)} tone={tone === 'blue' ? 'blue' : tone === 'emerald' ? 'emerald' : tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : 'neutral'} lozenge />;
  }

  return (
    <ScreenCanvas variant="wide">
      <CommandHero
        title="Projects"
        description="Active work, risk signals, and what each project needs next."
        primaryAction={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> New Project</button>}
        metrics={[
          { label: 'Active', value: activeCount },
          { label: 'At Risk', value: atRiskCount, tone: atRiskCount > 0 ? 'danger' : 'default' },
          { label: 'Event Week', value: eventWeekCount, tone: 'launch' },
          { label: 'Completed', value: completedCount, tone: 'success' },
        ]}
      />

      <ContextActionBar>
        <div className="relative min-w-[15rem] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Search projects..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'All')}>
          <option value="All">All statuses</option>
          {(['Idea', 'Planning', 'Active', 'On Hold', 'Event Week', 'Completed', 'Archived'] as ProjectStatus[]).map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className="select w-40" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'All')}>
          <option value="All">All priorities</option>
          {(['Urgent', 'High', 'Medium', 'Low'] as ProjectPriority[]).map((priority) => <option key={priority}>{priority}</option>)}
        </select>
        <select className="select w-44" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="deadline">Sort by next deadline</option>
          <option value="priority">Sort by priority</option>
          <option value="status">Sort by status</option>
          <option value="progress">Sort by progress</option>
        </select>
      </ContextActionBar>

      {featured.length > 0 && (
        <section className="space-y-3">
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">Featured project shelf</div>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {featured.map((project) => {
              const health = getProjectHealth(project, data);
              const next = getNextDeadlines(project, 1)[0];
              return (
                <Card key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{project.name}</h3>
                        {project.pinned && <Pin size={13} className="text-[var(--warning)]" />}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-tertiary)]">{project.type} · {project.year}</div>
                    </div>
                    <button className="btn-ghost p-1.5" onClick={(event) => togglePin(event, project)} aria-label={project.pinned ? 'Unpin project' : 'Pin project'}>
                      {project.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <PersonToken name={resolveMemberName(project.ownerId || project.owner, data.members, 'No owner')} detail="Owner" />
                    <StatusDot label={health.label} tone={health.label === 'Healthy' ? 'emerald' : health.label === 'Needs Attention' ? 'amber' : 'red'} lozenge />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={project.status} />
                      <StatusBadge status={project.priority} />
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{next ? `${next.label} · ${formatDateShort(next.date)}` : 'No next date recorded'}</div>
                  </div>
                  <ProgressBar value={project.progress} size="md" showLabel />
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">Project health matrix</div>
        {sorted.length === 0 ? (
          <EmptyMoment icon={<FolderKanban size={20} />} title="No projects found" description="Adjust the filters or create a new project." action={<button className="btn-primary" onClick={() => setShowForm(true)}>Create project</button>} />
        ) : (
          <Matrix
            columns={['Project', 'Tasks', 'Launches', 'Money', 'Meetings', 'Approvals']}
            rows={sorted.map((project) => {
              const health = getProjectHealth(project, data);
              const meetingCount = data.meetings.filter((meeting) => meeting.projectId === project.id).length;
              const approvalCount = data.approvals.filter((approval) => approval.projectId === project.id && approval.status !== 'Approved').length;
              const txCount = data.transactions.filter((transaction) => transaction.projectId === project.id).length;
              return (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="grid w-full grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(84px,1fr))] gap-3 border-b border-[var(--border-hairline)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.03] md:px-5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)]">{project.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{health.label}</div>
                  </div>
                  <div>{matrixCell(project, project.tasks.filter((task) => task.status !== 'Done' && task.status !== 'Approved').length, project.tasks.some((task) => task.status === 'Blocked') ? 'red' : 'blue')}</div>
                  <div>{matrixCell(project, project.prItems.filter((item) => item.publishingStatus !== 'Posted' && item.publishingStatus !== 'Archived').length, project.prItems.some((item) => item.approvalStatus === 'Changes Requested') ? 'amber' : 'blue')}</div>
                  <div>{matrixCell(project, txCount, txCount > 0 ? 'emerald' : 'neutral')}</div>
                  <div>{matrixCell(project, meetingCount, meetingCount > 0 ? 'blue' : 'neutral')}</div>
                  <div>{matrixCell(project, approvalCount, approvalCount > 0 ? 'amber' : 'neutral')}</div>
                </button>
              );
            })}
          />
        )}
        <p className="text-xs text-[var(--text-tertiary)]">Use filters above to view planning, completed, or archived projects.</p>
      </section>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Project" size="lg">
        <ProjectForm
          members={data.members}
          onSave={(projectInput) => {
            const templateId = (projectInput as Project & { _templateId?: ProjectTemplateId })._templateId ?? 'blank';
            const { _templateId, ...project } = projectInput as Project & { _templateId?: ProjectTemplateId };
            if (templateId !== 'blank') {
              const applied = applyProjectTemplate(templateId, project.id, project.ownerId, project.owner);
              saveProject({ ...project, phases: applied.phases, milestones: applied.milestones, tasks: applied.tasks, prItems: applied.prItems });
              applied.deliverables.forEach((deliverable) => saveDeliverable({ ...deliverable, projectId: project.id }));
              applied.eventDayItems.forEach((item) => saveEventDayItem({ ...item, projectId: project.id }));
            } else {
              saveProject(project);
            }
            setShowForm(false);
            navigate(`/projects/${project.id}`);
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </ScreenCanvas>
  );
}
