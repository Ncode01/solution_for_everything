import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowRight, FolderKanban, Pin, PinOff } from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getProjectHealth, getNextDeadlines } from '../../lib/stats';
import { resolveMemberName } from '../../components/MemberSelect';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import ProjectForm from './ProjectForm';
import { formatDateShort, isOverdue } from '../../lib/dateUtils';
import { useAutoNew } from '../../lib/useAutoNew';

type SortKey = 'deadline' | 'priority' | 'status' | 'progress';

const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_ORDER: Record<string, number> = {
  'Event Week': 0, Active: 1, Planning: 2, Idea: 3, 'On Hold': 4, Completed: 5, Archived: 6,
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data, saveProject } = useAppData();
  const projects = data.projects;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [showForm, setShowForm] = useState(false);

  useAutoNew(() => setShowForm(true));

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  function togglePin(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    saveProject({ ...project, pinned: !project.pinned });
  }

  const sorted = [...filtered].sort((a, b) => {
    // Pinned projects always come first
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
        return new Date(da).getTime() - new Date(db).getTime();
      }
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        description="All RCCS initiatives, sorted by what needs action next."
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'All')}>
          <option value="All">All Status</option>
          {(['Idea', 'Planning', 'Active', 'On Hold', 'Event Week', 'Completed', 'Archived'] as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="select w-36" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'All')}>
          <option value="All">All Priority</option>
          {(['Urgent', 'High', 'Medium', 'Low'] as ProjectPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="select w-44" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="deadline">Sort: Next deadline</option>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
          <option value="progress">Sort: Progress</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try adjusting your filters or create a new project."
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Create Project</button>}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((project) => {
            const health = getProjectHealth(project, data);
            const next = getNextDeadlines(project, 1)[0];
            const healthColor =
              health.label === 'Healthy' ? 'text-emerald-400' : health.label === 'Needs Attention' ? 'text-amber-400' : 'text-red-400';
            return (
              <Card key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <StatusBadge status={project.status} />
                      <StatusBadge status={project.priority} />
                      <span className={`text-xs font-medium ${healthColor}`}>{health.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.type} · {project.year} · {resolveMemberName(project.ownerId || project.owner, data.members, 'No owner')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => togglePin(e, project)}
                      className="btn-ghost p-1.5 rounded text-slate-600 hover:text-amber-400 transition-colors"
                      title={project.pinned ? 'Unpin project' : 'Pin project'}
                    >
                      {project.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                  </div>
                </div>

                <div className="mt-3">
                  <ProgressBar value={project.progress} showLabel size="md" />
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>{project.tasks.length} tasks</span>
                  {health.overdueCount > 0 && <span className="text-red-400">{health.overdueCount} overdue</span>}
                  {health.pendingApprovals > 0 && <span className="text-amber-400">{health.pendingApprovals} pending approvals</span>}
                  {next && (
                    <span className={isOverdue(next.date) ? 'text-red-400' : ''}>
                      Next: {next.label.slice(0, 28)}{next.label.length > 28 ? '…' : ''} · {formatDateShort(next.date)}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Project" size="lg">
        <ProjectForm
          onSave={(p: Project) => { saveProject(p); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
