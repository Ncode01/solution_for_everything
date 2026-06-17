import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Calendar, User, AlertTriangle,
  Target, ListTodo, Megaphone, LayoutGrid, ExternalLink, Check,
  CalendarCheck, Wallet, CheckSquare, FileText, Flag, Layers,
  Handshake, TrendingUp, TrendingDown, MinusCircle, Package,
  ClipboardList, DollarSign, Rocket,
} from 'lucide-react';
import {
  Project, Phase, Milestone, Task, PRItem, TaskStatus, TaskPriority, PhaseStatus, MilestoneStatus,
  PRApprovalStatus, PRPublishingStatus, Meeting, Sponsor, SponsorStage, PaymentStatus,
  Transaction, ApprovalRequest, FileLink, FileCategory,
  Deliverable, DeliverableType, DeliverableStatus, Member,
} from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { getProjectHealth, getNextDeadlines, getBudgetSummary, getSponsorTotals } from '../../lib/stats';
import { formatDate, formatDateShort, formatCurrency, isOverdue, generateId, todayISO } from '../../lib/dateUtils';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import QuickAddMenu from '../../components/QuickAddMenu';
import ProjectForm from './ProjectForm';
import PhaseForm from './PhaseForm';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import PRItemForm from '../pr/PRItemForm';
import MeetingForm from '../meetings/MeetingForm';
import SponsorForm from '../sponsors/SponsorForm';
import TransactionForm from '../budget/TransactionForm';
import BudgetForm from '../budget/BudgetForm';
import ApprovalForm from '../approvals/ApprovalForm';
import FileLinkForm from '../files/FileLinkForm';
import { generateProjectReport } from '../../lib/report';

type Tab = 'overview' | 'timeline' | 'tasks' | 'launches' | 'meetings' | 'money' | 'approvals';

const TASK_STATUSES: TaskStatus[] = ['To Do', 'Doing', 'Waiting', 'Review', 'Approved', 'Done', 'Blocked'];
const TASK_PRIORITIES: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const PHASE_STATUSES: PhaseStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];
const SPONSOR_STAGES: SponsorStage[] = ['Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Meeting Scheduled', 'Negotiating', 'Confirmed', 'Rejected', 'Completed'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Not Requested', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];
const FINANCE_CATEGORIES: FileCategory[] = ['Budget', 'Sponsorship', 'Receipts', 'Final Report'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data, saveProject, deleteProject, saveMeeting, deleteMeeting,
    saveSponsor, deleteSponsor, saveTransaction, deleteTransaction,
    saveBudget, saveApproval, deleteApproval, saveReport,
    saveFileLink, deleteFileLink,
  } = useAppData();
  const project = data.projects.find((p) => p.id === id);

  // Record project view for recently viewed
  React.useEffect(() => {
    if (id) {
      import('../../lib/recentProjects').then(({ recordProjectView }) => recordProjectView(id));
    }
  }, [id]);

  const [tab, setTab] = useState<Tab>('overview');
  const [editProject, setEditProject] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [phaseModal, setPhaseModal] = useState<{ open: boolean; editing?: Phase }>({ open: false });
  const [milestoneModal, setMilestoneModal] = useState<{ open: boolean; editing?: Milestone }>({ open: false });
  const [taskModal, setTaskModal] = useState<{ open: boolean; editing?: Task }>({ open: false });
  const [prModal, setPrModal] = useState<{ open: boolean; editing?: PRItem }>({ open: false });
  const [meetingModal, setMeetingModal] = useState<{ open: boolean; editing?: Meeting }>({ open: false });
  const [sponsorModal, setSponsorModal] = useState<{ open: boolean; editing?: Sponsor }>({ open: false });
  const [txnModal, setTxnModal] = useState<{ open: boolean; editing?: Transaction }>({ open: false });
  const [budgetModal, setBudgetModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; editing?: ApprovalRequest }>({ open: false });
  const [fileLinkModal, setFileLinkModal] = useState<{ open: boolean; editing?: FileLink; defaultCategory?: FileCategory }>({ open: false });
  const [taskFilter, setTaskFilter] = useState<TaskStatus | 'All'>('All');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  if (!project) {
    return (
      <div className="p-6">
        <button className="btn-ghost mb-4 flex items-center gap-2" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back</button>
        <div className="card text-center py-12 text-slate-500">Project not found.</div>
      </div>
    );
  }

  const p = project;
  const update = (updated: Project) => saveProject(updated);

  // --- phase handlers ---
  function savePhase(phase: Phase) {
    update({ ...p, phases: phaseModal.editing ? p.phases.map((x) => (x.id === phase.id ? phase : x)) : [...p.phases, phase] });
    setPhaseModal({ open: false });
  }
  function updatePhaseStatus(phaseId: string, status: PhaseStatus) {
    update({ ...p, phases: p.phases.map((x) => (x.id === phaseId ? { ...x, status } : x)) });
  }
  function deletePhase(phaseId: string) {
    update({ ...p, phases: p.phases.filter((x) => x.id !== phaseId) });
  }

  function saveMilestone(m: Milestone) {
    update({ ...p, milestones: milestoneModal.editing ? p.milestones.map((x) => (x.id === m.id ? m : x)) : [...p.milestones, m] });
    setMilestoneModal({ open: false });
  }
  function updateMilestoneStatus(mId: string, status: MilestoneStatus) {
    update({ ...p, milestones: p.milestones.map((m) => (m.id === mId ? { ...m, status } : m)) });
  }
  function saveTask(task: Task) {
    update({ ...p, tasks: taskModal.editing ? p.tasks.map((t) => (t.id === task.id ? task : t)) : [...p.tasks, task] });
    setTaskModal({ open: false });
  }
  function updateTaskStatus(taskId: string, status: TaskStatus) {
    update({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) });
  }
  function updateTaskPriority(taskId: string, priority: TaskPriority) {
    update({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, priority } : t)) });
  }
  function savePR(item: PRItem) {
    update({ ...p, prItems: prModal.editing ? p.prItems.map((x) => (x.id === item.id ? item : x)) : [...p.prItems, item] });
    setPrModal({ open: false });
  }
  function updatePRApproval(prId: string, approvalStatus: PRApprovalStatus) {
    update({ ...p, prItems: p.prItems.map((x) => (x.id === prId ? { ...x, approvalStatus } : x)) });
  }
  function updatePRPublishing(prId: string, publishingStatus: PRPublishingStatus) {
    update({ ...p, prItems: p.prItems.map((x) => (x.id === prId ? { ...x, publishingStatus } : x)) });
  }

  // --- derived data ---
  const health = getProjectHealth(p, data);
  const nextDeadlines = getNextDeadlines(p, 5);
  const overdueTasks = p.tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Approved');
  const pendingPR = p.prItems.filter((pr) => pr.approvalStatus === 'Internal Review' || pr.approvalStatus === 'Teacher Review');
  const projectMeetings = data.meetings.filter((m) => m.projectId === p.id);
  const openActionItems = projectMeetings.flatMap((m) => m.actionItems.filter((a) => a.status !== 'Done' && a.status !== 'Cancelled'));
  const projectSponsors = data.sponsors.filter((s) => s.projectId === p.id);
  const sponsorTotals = getSponsorTotals(projectSponsors);
  const budgetSummary = getBudgetSummary(data, p.id);
  const projectApprovals = data.approvals.filter((a) => a.projectId === p.id);
  const pendingApprovals = projectApprovals.filter((a) => a.status === 'Submitted' || a.status === 'Changes Requested');
  const budget = data.budgets.find((b) => b.projectId === p.id);
  const projectTxns = data.transactions.filter((t) => t.projectId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const projectFiles = data.fileLinks.filter((f) => f.projectId === p.id);
  const financeFiles = projectFiles.filter((f) => FINANCE_CATEGORIES.includes(f.category as FileCategory));
  const overdueSponsorFollowUps = projectSponsors.filter((s) => s.nextFollowUpDate && isOverdue(s.nextFollowUpDate) && s.stage !== 'Confirmed' && s.stage !== 'Completed' && s.stage !== 'Rejected');
  const missingReceipts = projectTxns.filter((t) => t.type === 'Expense' && !t.receiptLink);
  const allDeliverables = projectSponsors.flatMap((s) => s.deliverables.map((d) => ({ ...d, sponsorName: s.name, sponsorId: s.id })));
  const overdueDeliverables = allDeliverables.filter((d) => d.dueDate && isOverdue(d.dueDate) && d.status !== 'Delivered' && d.status !== 'Cancelled');

  const filteredTasks = p.tasks.filter((t) => taskFilter === 'All' || t.status === taskFilter);
  const filteredTxns = projectTxns.filter((t) => txnTypeFilter === 'All' || t.type === txnTypeFilter);

  const healthColor = health.label === 'Healthy' ? 'text-emerald-400' : health.label === 'Needs Attention' ? 'text-amber-400' : 'text-red-400';

  const moneyHealthScore = (() => {
    let issues = 0;
    if (missingReceipts.length > 0) issues++;
    if (overdueSponsorFollowUps.length > 0) issues++;
    if (budgetSummary.actualExpense > budgetSummary.expectedExpense && budgetSummary.expectedExpense > 0) issues++;
    if (overdueDeliverables.length > 0) issues++;
    if (issues === 0) return 'Healthy';
    if (issues <= 1) return 'Needs Attention';
    return 'At Risk';
  })();

  const moneyHealthColor = moneyHealthScore === 'Healthy' ? 'text-emerald-400' : moneyHealthScore === 'Needs Attention' ? 'text-amber-400' : 'text-red-400';

  const projectDeliverables = (data.deliverables ?? []).filter((d) => d.projectId === p.id);

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',  icon: LayoutGrid },
    { id: 'timeline',  label: 'Timeline',  icon: Layers, badge: (p.phases.length + p.milestones.length + projectDeliverables.length) || undefined },
    { id: 'tasks',     label: 'Tasks',     icon: ListTodo, badge: p.tasks.length || undefined },
    { id: 'launches',  label: 'Launches',  icon: Megaphone, badge: p.prItems.length || undefined },
    { id: 'meetings',  label: 'Meetings',  icon: CalendarCheck, badge: projectMeetings.length || undefined },
    { id: 'money',     label: 'Money',     icon: Wallet },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingApprovals.length || undefined },
  ];

  const quickActions = [
    { label: 'Add Task',        icon: ListTodo,     onClick: () => { setTab('tasks');    setTaskModal({ open: true }); } },
    { label: 'Add Milestone',   icon: Target,       onClick: () => { setTab('timeline'); setMilestoneModal({ open: true }); } },
    { label: 'Add Launch',      icon: Megaphone,    onClick: () => { setTab('launches'); setPrModal({ open: true }); } },
    { label: 'Add Meeting',     icon: CalendarCheck,onClick: () => { setTab('meetings'); setMeetingModal({ open: true }); } },
    { label: 'Add Sponsor',     icon: Handshake,    onClick: () => { setTab('money');    setSponsorModal({ open: true }); } },
    { label: 'Add Transaction', icon: Wallet,       onClick: () => { setTab('money');    setTxnModal({ open: true }); } },
    { label: 'Add File Link',   icon: FileText,     onClick: () => setFileLinkModal({ open: true }) },
    { label: 'Generate Report', icon: FileText,     onClick: generateAndSaveReport },
  ];

  function generateAndSaveReport() {
    const r = generateProjectReport(data, p);
    saveReport({ id: generateId(), projectId: p.id, title: r.title, type: 'Project Summary', summary: r.summary, generatedDate: todayISO(), sections: r.sections });
    navigate('/library?section=reports');
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button className="btn-ghost p-2" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{p.name}</h1>
            <StatusBadge status={p.status} size="md" />
            <StatusBadge status={p.priority} size="md" />
            <span className={`text-sm font-medium ${healthColor}`}>{health.label}</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{p.type} · {p.year} · {p.owner || 'No owner'}</p>
        </div>
        <div className="flex items-center gap-2">
          <QuickAddMenu actions={quickActions} />
          <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={() => setEditProject(true)}><Edit2 size={14} /> Edit</button>
        </div>
      </div>

      {/* Meta + command summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-500 flex items-center gap-1"><User size={11} /> Owner</p><p className="text-slate-200">{p.owner || '—'}</p></div>
            <div><p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11} /> Timeline</p><p className="text-slate-200 text-xs">{formatDateShort(p.startDate)} → {formatDateShort(p.endDate)}</p></div>
            {p.finalEventDate && <div><p className="text-xs text-slate-500 flex items-center gap-1"><Flag size={11} /> Final Event</p><p className="text-violet-300">{formatDate(p.finalEventDate)}</p></div>}
            <div><p className="text-xs text-slate-500">Next Deadline</p><p className="text-slate-200 text-xs">{nextDeadlines[0] ? formatDateShort(nextDeadlines[0].date) : '—'}</p></div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>{p.progress}%</span></div>
            <ProgressBar value={p.progress} size="md" />
          </div>
          {p.description && <p className="text-slate-400 text-sm mt-3 pt-3 border-t border-slate-800">{p.description}</p>}
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader title="Command Summary" tone={health.label === 'At Risk' ? 'danger' : 'default'} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <button onClick={() => setTab('tasks')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className={`text-lg font-bold ${overdueTasks.length ? 'text-red-400' : 'text-white'}`}>{overdueTasks.length}</p>
              <p className="text-xs text-slate-500">Overdue tasks</p>
            </button>
            <button onClick={() => setTab('launches')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className={`text-lg font-bold ${pendingPR.length ? 'text-amber-400' : 'text-white'}`}>{pendingPR.length}</p>
              <p className="text-xs text-slate-500">Launches awaiting approval</p>
            </button>
            <button onClick={() => setTab('approvals')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className={`text-lg font-bold ${pendingApprovals.length ? 'text-amber-400' : 'text-white'}`}>{pendingApprovals.length}</p>
              <p className="text-xs text-slate-500">Pending approvals</p>
            </button>
            <button onClick={() => setTab('meetings')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className={`text-lg font-bold ${openActionItems.length ? 'text-amber-400' : 'text-white'}`}>{openActionItems.length}</p>
              <p className="text-xs text-slate-500">Open action items</p>
            </button>
            <button onClick={() => setTab('money')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(sponsorTotals.confirmed)}</p>
              <p className="text-xs text-slate-500">Confirmed sponsorship</p>
            </button>
            <button onClick={() => setTab('money')} className="bg-slate-800/50 rounded-lg p-2.5 text-left hover:bg-slate-800 transition-colors">
              <p className={`text-lg font-bold ${budgetSummary.surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(budgetSummary.surplus)}</p>
              <p className="text-xs text-slate-500">Budget surplus</p>
            </button>
          </div>
          {nextDeadlines.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-1.5">Next deadlines</p>
              <div className="space-y-1">
                {nextDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate">{d.type}: {d.label}</span>
                    <span className={`shrink-0 ml-2 ${isOverdue(d.date) ? 'text-red-400' : 'text-slate-500'}`}>{formatDateShort(d.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon, badge }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === tabId ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={15} /> {label}
            {badge !== undefined && badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === tabId ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Smart missing-info warnings */}
          {(() => {
            const warnings: string[] = [];
            if (!p.owner && !p.ownerId) warnings.push('No project owner assigned.');
            if (!p.endDate) warnings.push('No end date set.');
            if (p.tasks.length === 0) warnings.push('No tasks created yet.');
            if (p.phases.length === 0) warnings.push('No phases/roadmap defined.');
            if (p.status === 'Active' && p.progress === 0) warnings.push('Progress is at 0% but status is Active.');
            const tasksWithoutAssignee = p.tasks.filter((t) => !t.assignee && !t.assigneeId).length;
            if (tasksWithoutAssignee > 0) warnings.push(`${tasksWithoutAssignee} task${tasksWithoutAssignee > 1 ? 's' : ''} without an assignee.`);
            if (warnings.length === 0) return null;
            return (
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Missing information
                </p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-300/80">• {w}</p>
                ))}
              </div>
            );
          })()}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <SectionHeader title="Upcoming Deadlines" />
              <div className="space-y-2">
                {nextDeadlines.length === 0 && <p className="text-slate-600 text-sm">No upcoming deadlines.</p>}
                {nextDeadlines.map((item, i) => (
                  <Card key={i} className="py-2.5 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'Milestone' ? 'bg-amber-400' : item.type === 'Event' ? 'bg-violet-400' : 'bg-blue-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.type} · {formatDateShort(item.date)}</p>
                    </div>
                    {isOverdue(item.date) && <span className="text-red-400 text-xs shrink-0">Overdue</span>}
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <SectionHeader title="Overdue Tasks" tone="danger" count={overdueTasks.length} />
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((task) => (
                  <Card key={task.id} className="py-2.5 border-red-900/40">
                    <p className="text-sm text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
                      <StatusBadge status={task.priority} />
                    </div>
                  </Card>
                ))}
                {overdueTasks.length === 0 && <p className="text-slate-600 text-sm">No overdue tasks.</p>}
              </div>
            </div>
          </div>

          {/* Project Roadmap — phases compact */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Project Roadmap" count={p.phases.length} />
              <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => setPhaseModal({ open: true })}><Plus size={13} /> Add Phase</button>
            </div>
            {p.phases.length === 0 ? (
              <Card className="py-5 text-center">
                <Layers size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No phases defined.</p>
                <button className="btn-secondary text-xs mt-2" onClick={() => setPhaseModal({ open: true })}>Add Phase</button>
              </Card>
            ) : (
              <div className="space-y-2">
                {p.phases.map((phase) => (
                  <Card key={phase.id} className="py-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm">{phase.name}</span>
                          <StatusBadge status={phase.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          {phase.owner && <span>Owner: {phase.owner}</span>}
                          {phase.startDate && phase.endDate && <span>{formatDateShort(phase.startDate)} → {formatDateShort(phase.endDate)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          className="select text-xs py-1 w-32"
                          value={phase.status}
                          onChange={(e) => updatePhaseStatus(phase.id, e.target.value as PhaseStatus)}
                        >
                          {PHASE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button className="btn-ghost p-1.5" onClick={() => setPhaseModal({ open: true, editing: phase })}><Edit2 size={13} /></button>
                        <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this phase?', onConfirm: () => deletePhase(phase.id) })}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={phase.progress} size="sm" showLabel />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Important Links & Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Important Links & Documents" count={projectFiles.length} />
              <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => setFileLinkModal({ open: true })}><Plus size={13} /> Add Link</button>
            </div>
            {projectFiles.length === 0 ? (
              <Card className="py-5 text-center">
                <FileText size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No file links yet. Add proposals, budgets, or designs.</p>
                <button className="btn-secondary text-xs mt-2" onClick={() => setFileLinkModal({ open: true })}>Add File Link</button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {projectFiles.slice(0, 8).map((f) => (
                  <Card key={f.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{f.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{f.category}</span>
                        <StatusBadge status={f.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-blue-400"><ExternalLink size={13} /></a>
                      <button className="btn-ghost p-1.5" onClick={() => setFileLinkModal({ open: true, editing: f })}><Edit2 size={13} /></button>
                      <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: `Remove link "${f.title}"?`, onConfirm: () => deleteFileLink(f.id) })}><Trash2 size={13} /></button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {projectFiles.length > 8 && (
              <p className="text-xs text-slate-500 mt-2 text-center">{projectFiles.length - 8} more links — use Add Link to see all</p>
            )}
          </div>

          {/* Generate Report */}
          <Card className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-white text-sm flex items-center gap-2"><ClipboardList size={15} /> Generate Project Report</p>
              <p className="text-xs text-slate-500 mt-0.5">Create a full summary for handover, review, or team records.</p>
            </div>
            <button className="btn-primary text-sm" onClick={generateAndSaveReport}><FileText size={14} /> Generate & Save</button>
          </Card>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab === 'timeline' && (
        <div className="space-y-5">
          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Layers size={14} className="text-slate-400" /> Phases</h3>
              <button className="btn-secondary text-xs" onClick={() => setPhaseModal({ open: true })}><Plus size={13} /> Add Phase</button>
            </div>
            {p.phases.length === 0 ? (
              <Card className="py-5 text-center text-slate-500 text-sm">No phases defined.</Card>
            ) : (
              <div className="space-y-2">
                {p.phases.map((phase) => (
                  <Card key={phase.id} className="py-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm">{phase.name}</span>
                          <StatusBadge status={phase.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          {phase.owner && <span>Owner: {phase.owner}</span>}
                          {phase.startDate && phase.endDate && <span>{formatDateShort(phase.startDate)} → {formatDateShort(phase.endDate)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select className="select text-xs py-1 w-32" value={phase.status} onChange={(e) => updatePhaseStatus(phase.id, e.target.value as PhaseStatus)}>
                          {PHASE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button className="btn-ghost p-1.5" onClick={() => setPhaseModal({ open: true, editing: phase })}><Edit2 size={13} /></button>
                        <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this phase?', onConfirm: () => deletePhase(phase.id) })}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="mt-2"><ProgressBar value={phase.progress} size="sm" showLabel /></div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Target size={14} className="text-slate-400" /> Milestones</h3>
              <button className="btn-secondary text-xs" onClick={() => setMilestoneModal({ open: true })}><Plus size={13} /> Add Milestone</button>
            </div>
            {p.milestones.length === 0 ? (
              <Card className="py-5 text-center text-slate-500 text-sm">No milestones yet.</Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="border-b border-slate-800">
                    <th className="table-header text-left py-2 pr-4">Milestone</th>
                    <th className="table-header text-left py-2 pr-4">Due Date</th>
                    <th className="table-header text-left py-2 pr-4">Owner</th>
                    <th className="table-header text-left py-2 pr-4">Status</th>
                    <th className="table-header text-left py-2"></th>
                  </tr></thead>
                  <tbody>
                    {p.milestones.map((m) => (
                      <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4"><p className="font-medium text-white">{m.name}</p>{m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}</td>
                        <td className="py-3 pr-4 whitespace-nowrap"><span className={isOverdue(m.dueDate) && m.status !== 'Completed' ? 'text-red-400' : 'text-slate-300'}>{formatDate(m.dueDate)}</span></td>
                        <td className="py-3 pr-4 text-slate-400">{m.owner || '—'}</td>
                        <td className="py-3 pr-4">
                          <select className="select text-xs py-1 w-40" value={m.status} onChange={(e) => updateMilestoneStatus(m.id, e.target.value as MilestoneStatus)}>
                            {(['Not Started', 'In Progress', 'Blocked', 'Pending Approval', 'Completed', 'Delayed', 'Cancelled'] as MilestoneStatus[]).map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-3"><div className="flex items-center gap-1">
                          <button className="btn-ghost p-1.5" onClick={() => setMilestoneModal({ open: true, editing: m })}><Edit2 size={13} /></button>
                          <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this milestone?', onConfirm: () => update({ ...p, milestones: p.milestones.filter((x) => x.id !== m.id) }) })}><Trash2 size={13} /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <DeliverableSection projectId={p.id} projectDeliverables={projectDeliverables} members={data.members} />
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <select className="select text-xs py-1.5 w-32" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value as TaskStatus | 'All')}>
              <option value="All">All Status</option>
              {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setTaskModal({ open: true })}><Plus size={15} /> Add Task</button>
          </div>
          {filteredTasks.length === 0 ? (
            <EmptyState icon={ListTodo} title="No tasks" description="Create tasks to track work for this project." action={<button className="btn-primary" onClick={() => setTaskModal({ open: true })}>Add Task</button>} />
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <Card key={task.id} className={isOverdue(task.dueDate) && task.status !== 'Done' && task.status !== 'Approved' ? 'border-red-900/40' : ''}>
                  <div className="flex items-start gap-3">
                    <button
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.status === 'Done' || task.status === 'Approved' ? 'bg-green-600 border-green-600' : 'border-slate-600 hover:border-blue-500'}`}
                      onClick={() => updateTaskStatus(task.id, task.status === 'Done' ? 'To Do' : 'Done')}
                    >
                      {(task.status === 'Done' || task.status === 'Approved') && <Check size={10} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${task.status === 'Done' || task.status === 'Approved' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User size={10} /> {task.assigneeId ? (data.members.find((m) => m.id === task.assigneeId)?.displayName || task.assignee || 'Unassigned') : (task.assignee || 'Unassigned')}</span>
                        {task.dueDate && <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'text-red-400' : ''}`}><Calendar size={10} /> {formatDateShort(task.dueDate)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <select className="select text-xs py-1 w-28" value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}>{TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                      <select className="select text-xs py-1 w-24" value={task.priority} onChange={(e) => updateTaskPriority(task.id, e.target.value as TaskPriority)}>{TASK_PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
                      <button className="btn-ghost p-1.5" onClick={() => setTaskModal({ open: true, editing: task })}><Edit2 size={13} /></button>
                      <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this task?', onConfirm: () => update({ ...p, tasks: p.tasks.filter((x) => x.id !== task.id) }) })}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LAUNCHES ── */}
      {tab === 'launches' && (
        <div className="space-y-3">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setPrModal({ open: true })}><Plus size={15} /> Add Launch Item</button></div>
          {p.prItems.length === 0 ? (
            <EmptyState icon={Megaphone} title="No launch items" description="Plan posts, campaigns, and announcements for this project." action={<button className="btn-primary" onClick={() => setPrModal({ open: true })}>Add Launch Item</button>} />
          ) : p.prItems.map((pr) => (
            <Card key={pr.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-white text-sm">{pr.title}</h3><StatusBadge status={pr.approvalStatus} /><StatusBadge status={pr.publishingStatus} /></div>
                  <p className="text-xs text-slate-500 mt-0.5">{pr.platform} · {pr.campaign}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                    <span>{pr.publishDate || 'No date'} {pr.publishTime}</span>
                    <span>Designer: {pr.designer || '—'}</span>
                    {pr.designLink && <a href={pr.designLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><ExternalLink size={10} /> Design</a>}
                  </div>
                  {pr.caption && <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">"{pr.caption}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <select className="select text-xs py-1 w-36" value={pr.approvalStatus} onChange={(e) => updatePRApproval(pr.id, e.target.value as PRApprovalStatus)}>{(['Draft', 'Internal Review', 'Teacher Review', 'Approved', 'Changes Requested'] as PRApprovalStatus[]).map((s) => <option key={s}>{s}</option>)}</select>
                  <select className="select text-xs py-1 w-28" value={pr.publishingStatus} onChange={(e) => updatePRPublishing(pr.id, e.target.value as PRPublishingStatus)}>{(['Idea', 'Designing', 'Scheduled', 'Posted', 'Archived'] as PRPublishingStatus[]).map((s) => <option key={s}>{s}</option>)}</select>
                  <button className="btn-ghost p-1.5" onClick={() => setPrModal({ open: true, editing: pr })}><Edit2 size={13} /></button>
                  <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this launch item?', onConfirm: () => update({ ...p, prItems: p.prItems.filter((x) => x.id !== pr.id) }) })}><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
          {projectFiles.filter((f) => ['PR', 'Designs', 'Videos'].includes(f.category)).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Launch Files & Links</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {projectFiles.filter((f) => ['PR', 'Designs', 'Videos'].includes(f.category)).map((f) => (
                  <Card key={f.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{f.title}</p>
                      <span className="text-xs text-slate-500">{f.category}</span>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-blue-400 shrink-0"><ExternalLink size={13} /></a>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MEETINGS ── */}
      {tab === 'meetings' && (
        <div className="space-y-3">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setMeetingModal({ open: true })}><Plus size={15} /> Add Meeting</button></div>
          {projectMeetings.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No meetings" description="Record project meetings, decisions, and action items." action={<button className="btn-primary" onClick={() => setMeetingModal({ open: true })}>Add Meeting</button>} />
          ) : projectMeetings.map((m) => {
            const open = m.actionItems.filter((a) => a.status !== 'Done' && a.status !== 'Cancelled').length;
            return (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{m.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.type} · {formatDate(m.date)} {m.time}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="btn-ghost p-1.5" onClick={() => setMeetingModal({ open: true, editing: m })}><Edit2 size={13} /></button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: `Delete "${m.title}"?`, onConfirm: () => deleteMeeting(m.id) })}><Trash2 size={13} /></button>
                  </div>
                </div>
                {m.decisions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">{m.decisions.length} decision{m.decisions.length !== 1 ? 's' : ''}</p>
                    {m.decisions.slice(0, 2).map((d) => (
                      <p key={d.id} className="text-xs text-slate-400 truncate">· {d.decision}</p>
                    ))}
                  </div>
                )}
                {m.actionItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    {m.actionItems.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className={a.status === 'Done' ? 'line-through text-slate-600' : 'text-slate-300'}>{a.title}</span>
                        <span className="text-slate-500">{a.owner || '—'}{a.dueDate ? ` · ${formatDateShort(a.dueDate)}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                {open > 0 && <p className="text-xs text-amber-400 mt-1">{open} open action item{open > 1 ? 's' : ''}</p>}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── MONEY ── */}
      {tab === 'money' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Expected Income</p>
              <p className="text-lg font-bold text-slate-200">{formatCurrency(budgetSummary.expectedIncome)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Check size={11} /> Confirmed Income</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(budgetSummary.confirmedIncome)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingDown size={11} /> Expected Expense</p>
              <p className="text-lg font-bold text-slate-200">{formatCurrency(budgetSummary.expectedExpense)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><DollarSign size={11} /> Recorded Expense</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(budgetSummary.actualExpense)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><MinusCircle size={11} /> Surplus/Deficit</p>
              <p className={`text-lg font-bold ${budgetSummary.surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(budgetSummary.surplus)}</p>
            </Card>
            <Card className="py-3">
              <p className="text-xs text-slate-500 flex items-center gap-1"><Handshake size={11} /> Sponsor Pipeline</p>
              <p className="text-lg font-bold text-amber-400">{formatCurrency(sponsorTotals.pipeline)}</p>
            </Card>
          </div>

          {/* Money Health */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-2">
                <SectionHeader title="Money Health" />
                <span className={`text-sm font-semibold ${moneyHealthColor}`}>{moneyHealthScore}</span>
              </div>
              <button className="btn-secondary text-xs" onClick={() => setBudgetModal(true)}>Edit Budget Plan</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-white">{budgetSummary.usagePct}%</p>
                <p className="text-xs text-slate-500">Budget used</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                <p className={`text-lg font-bold ${missingReceipts.length > 0 ? 'text-amber-400' : 'text-white'}`}>{missingReceipts.length}</p>
                <p className="text-xs text-slate-500">Missing receipts</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                <p className={`text-lg font-bold ${overdueSponsorFollowUps.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdueSponsorFollowUps.length}</p>
                <p className="text-xs text-slate-500">Overdue follow-ups</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                <p className={`text-lg font-bold ${overdueDeliverables.length > 0 ? 'text-amber-400' : 'text-white'}`}>{overdueDeliverables.length}</p>
                <p className="text-xs text-slate-500">Overdue deliverables</p>
              </div>
            </div>
            {budgetSummary.expectedExpense > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Budget Usage</span><span>{budgetSummary.usagePct}% of {formatCurrency(budgetSummary.expectedExpense)}</span></div>
                <ProgressBar value={budgetSummary.usagePct} size="md" />
              </div>
            )}
          </Card>

          {/* Sponsorship Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <SectionHeader title="Sponsorship Pipeline" count={projectSponsors.length} />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-emerald-400 font-medium">{formatCurrency(sponsorTotals.confirmed)} confirmed</span>
                  <span>·</span>
                  <span className="text-amber-400 font-medium">{formatCurrency(sponsorTotals.pipeline)} pipeline</span>
                </div>
              </div>
              <button className="btn-primary text-xs flex items-center gap-1" onClick={() => setSponsorModal({ open: true })}><Plus size={13} /> Add Sponsor</button>
            </div>
            {projectSponsors.length === 0 ? (
              <EmptyState icon={Handshake} title="No sponsors yet" description="Track sponsor outreach, payments, and deliverables here." action={<button className="btn-primary" onClick={() => setSponsorModal({ open: true })}>Add Sponsor</button>} />
            ) : (
              <div className="space-y-2">
                {projectSponsors.map((s) => {
                  const followOverdue = s.nextFollowUpDate && isOverdue(s.nextFollowUpDate) && s.stage !== 'Confirmed' && s.stage !== 'Completed' && s.stage !== 'Rejected';
                  return (
                    <Card key={s.id}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white text-sm">{s.name}</h3>
                            <StatusBadge status={s.stage} />
                            <StatusBadge status={s.paymentStatus} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{s.packageName} · {formatCurrency(s.amount)} · {s.assignedMember || 'Unassigned'}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            {s.nextFollowUpDate && (
                              <span className={followOverdue ? 'text-red-400' : ''}>Follow-up: {formatDate(s.nextFollowUpDate)}</span>
                            )}
                            {s.deliverables.length > 0 && <span>{s.deliverables.length} deliverable{s.deliverables.length !== 1 ? 's' : ''}</span>}
                            {s.proposalLink && <a href={s.proposalLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><FileText size={11} /> Proposal</a>}
                            {s.agreementLink && <a href={s.agreementLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center gap-1"><ExternalLink size={11} /> Agreement</a>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <select className="select text-xs py-1 w-36" value={s.stage} onChange={(e) => saveSponsor({ ...s, stage: e.target.value as SponsorStage })}>
                            {SPONSOR_STAGES.map((x) => <option key={x}>{x}</option>)}
                          </select>
                          <select className="select text-xs py-1 w-32" value={s.paymentStatus} onChange={(e) => saveSponsor({ ...s, paymentStatus: e.target.value as PaymentStatus })}>
                            {PAYMENT_STATUSES.map((x) => <option key={x}>{x}</option>)}
                          </select>
                          <button className="btn-ghost p-1.5" onClick={() => setSponsorModal({ open: true, editing: s })}><Edit2 size={13} /></button>
                          <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: `Delete "${s.name}"?`, onConfirm: () => deleteSponsor(s.id) })}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income & Expenses */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <SectionHeader title="Income & Expenses" count={projectTxns.length} />
              <div className="flex items-center gap-2">
                <select className="select text-xs py-1 w-32" value={txnTypeFilter} onChange={(e) => setTxnTypeFilter(e.target.value as 'All' | 'Income' | 'Expense')}>
                  <option value="All">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
                <button className="btn-primary text-xs flex items-center gap-1" onClick={() => setTxnModal({ open: true })}><Plus size={13} /> Add Transaction</button>
              </div>
            </div>
            {filteredTxns.length === 0 ? (
              <EmptyState icon={Wallet} title="No transactions" description="Add income or expense records to track spending." action={<button className="btn-primary" onClick={() => setTxnModal({ open: true })}>Add Transaction</button>} />
            ) : (
              <div className="space-y-2">
                {filteredTxns.map((t) => (
                  <Card key={t.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-white">{t.category} <span className={t.type === 'Income' ? 'text-emerald-400' : 'text-red-400'}>· {t.type}</span></p>
                        <p className="text-xs text-slate-500">
                          {formatDate(t.date)}
                          {t.approvedBy ? ` · ${t.approvedBy}` : ''}
                          {t.type === 'Expense' && !t.receiptLink ? <span className="text-amber-400 ml-1.5">⚠ no receipt</span> : ''}
                        </p>
                        {t.notes && <p className="text-xs text-slate-600 mt-0.5">{t.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className={`text-sm font-medium ${t.type === 'Income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}</span>
                          {t.receiptLink && <a href={t.receiptLink} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-400 flex items-center gap-1 justify-end mt-0.5"><ExternalLink size={10} /> Receipt</a>}
                        </div>
                        <button className="btn-ghost p-1.5" onClick={() => setTxnModal({ open: true, editing: t })}><Edit2 size={13} /></button>
                        <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: 'Delete this transaction?', onConfirm: () => deleteTransaction(t.id) })}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sponsor Deliverables */}
          {allDeliverables.length > 0 && (
            <div>
              <SectionHeader title="Sponsor Deliverables" count={allDeliverables.length} />
              <div className="space-y-2 mt-3">
                {allDeliverables.map((d) => (
                  <Card key={d.id} className={`py-2.5 ${d.dueDate && isOverdue(d.dueDate) && d.status !== 'Delivered' && d.status !== 'Cancelled' ? 'border-amber-900/40' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{d.title}</p>
                        <p className="text-xs text-slate-500">{d.sponsorName}{d.dueDate ? ` · Due ${formatDate(d.dueDate)}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={d.status} />
                        {d.dueDate && isOverdue(d.dueDate) && d.status !== 'Delivered' && d.status !== 'Cancelled' && (
                          <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle size={11} /> Overdue</span>
                        )}
                        <button className="btn-ghost p-1.5" onClick={() => {
                          const sponsor = projectSponsors.find((s) => s.id === d.sponsorId);
                          if (sponsor) setSponsorModal({ open: true, editing: sponsor });
                        }}><Edit2 size={13} /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Finance Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Finance Documents" count={financeFiles.length} />
              <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => setFileLinkModal({ open: true, defaultCategory: 'Budget' })}><Plus size={13} /> Add Document</button>
            </div>
            {financeFiles.length === 0 ? (
              <Card className="py-5 text-center">
                <Package size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No finance documents linked. Add budget sheets, receipts, or sponsorship agreements.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {financeFiles.map((f) => (
                  <Card key={f.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{f.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{f.category}</span>
                        <StatusBadge status={f.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-blue-400"><ExternalLink size={13} /></a>
                      <button className="btn-ghost p-1.5" onClick={() => setFileLinkModal({ open: true, editing: f })}><Edit2 size={13} /></button>
                      <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: `Remove "${f.title}"?`, onConfirm: () => deleteFileLink(f.id) })}><Trash2 size={13} /></button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPROVALS ── */}
      {tab === 'approvals' && (
        <div className="space-y-3">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setApprovalModal({ open: true })}><Plus size={15} /> New Request</button></div>
          {projectApprovals.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No approval requests" description="Track sign-off for posters, budgets, and agendas." action={<button className="btn-primary" onClick={() => setApprovalModal({ open: true })}>New Request</button>} />
          ) : projectApprovals.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-white text-sm">{a.title}</h3><StatusBadge status={a.status} /></div>
                  <p className="text-xs text-slate-500 mt-0.5">{a.relatedType} · {a.requestedBy} → {a.approver}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatDate(a.submittedDate)}{a.decisionDate ? ` → ${formatDate(a.decisionDate)}` : ''}</p>
                  {a.comments && <p className="text-xs text-slate-600 mt-1 italic">"{a.comments}"</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="btn-ghost p-1.5" onClick={() => setApprovalModal({ open: true, editing: a })}><Edit2 size={13} /></button>
                  <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm({ message: `Delete "${a.title}"?`, onConfirm: () => deleteApproval(a.id) })}><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Project actions footer */}
      <div className="flex justify-end pt-2">
        <button className="btn-ghost text-xs text-slate-600 hover:text-red-400 flex items-center gap-1.5" onClick={() => setConfirmDeleteProject(true)}>
          <Trash2 size={13} /> Delete Project
        </button>
      </div>

      {/* ── MODALS ── */}
      <Modal open={editProject} onClose={() => setEditProject(false)} title="Edit Project" size="lg">
        <ProjectForm initial={p} onSave={(up) => { update(up); setEditProject(false); }} onCancel={() => setEditProject(false)} />
      </Modal>
      <Modal open={phaseModal.open} onClose={() => setPhaseModal({ open: false })} title={phaseModal.editing ? 'Edit Phase' : 'Add Phase'}>
        <PhaseForm projectId={p.id} initial={phaseModal.editing} onSave={savePhase} onCancel={() => setPhaseModal({ open: false })} />
      </Modal>
      <Modal open={milestoneModal.open} onClose={() => setMilestoneModal({ open: false })} title={milestoneModal.editing ? 'Edit Milestone' : 'Add Milestone'}>
        <MilestoneForm projectId={p.id} phases={p.phases} members={data.members} initial={milestoneModal.editing} onSave={saveMilestone} onCancel={() => setMilestoneModal({ open: false })} />
      </Modal>
      <Modal open={taskModal.open} onClose={() => setTaskModal({ open: false })} title={taskModal.editing ? 'Edit Task' : 'Add Task'}>
        <TaskForm projectId={p.id} phases={p.phases} milestones={p.milestones} members={data.members} initial={taskModal.editing} onSave={saveTask} onCancel={() => setTaskModal({ open: false })} />
      </Modal>
      <Modal open={prModal.open} onClose={() => setPrModal({ open: false })} title={prModal.editing ? 'Edit PR Item' : 'Add PR Item'} size="lg">
        <PRItemForm projectId={p.id} members={data.members} initial={prModal.editing} onSave={savePR} onCancel={() => setPrModal({ open: false })} />
      </Modal>
      <Modal open={meetingModal.open} onClose={() => setMeetingModal({ open: false })} title={meetingModal.editing ? 'Edit Meeting' : 'Add Meeting'} size="lg">
        <MeetingForm projects={data.projects} members={data.members} lockedProjectId={p.id} initial={meetingModal.editing} onSave={(m) => { saveMeeting(m); setMeetingModal({ open: false }); }} onCancel={() => setMeetingModal({ open: false })} />
      </Modal>
      <Modal open={sponsorModal.open} onClose={() => setSponsorModal({ open: false })} title={sponsorModal.editing ? 'Edit Sponsor' : 'Add Sponsor'} size="lg">
        <SponsorForm projects={data.projects} members={data.members} lockedProjectId={p.id} initial={sponsorModal.editing} onSave={(s) => { saveSponsor(s); setSponsorModal({ open: false }); }} onCancel={() => setSponsorModal({ open: false })} />
      </Modal>
      <Modal open={txnModal.open} onClose={() => setTxnModal({ open: false })} title={txnModal.editing ? 'Edit Transaction' : 'Add Transaction'} size="lg">
        <TransactionForm projects={data.projects} members={data.members} lockedProjectId={p.id} initial={txnModal.editing} onSave={(t) => { saveTransaction(t); setTxnModal({ open: false }); }} onCancel={() => setTxnModal({ open: false })} />
      </Modal>
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Edit Budget Plan">
        <BudgetForm projectId={p.id} initial={budget} onSave={(b) => { saveBudget(b); setBudgetModal(false); }} onCancel={() => setBudgetModal(false)} />
      </Modal>
      <Modal open={approvalModal.open} onClose={() => setApprovalModal({ open: false })} title={approvalModal.editing ? 'Edit Request' : 'New Approval Request'} size="lg">
        <ApprovalForm projects={data.projects} members={data.members} lockedProjectId={p.id} initial={approvalModal.editing} onSave={(a) => { saveApproval(a); setApprovalModal({ open: false }); }} onCancel={() => setApprovalModal({ open: false })} />
      </Modal>
      <Modal open={fileLinkModal.open} onClose={() => setFileLinkModal({ open: false })} title={fileLinkModal.editing ? 'Edit File Link' : 'Add File Link'}>
        <FileLinkForm
          projectId={p.id}
          members={data.members}
          initial={fileLinkModal.editing ?? (fileLinkModal.defaultCategory ? { id: '', projectId: p.id, title: '', category: fileLinkModal.defaultCategory, url: '', owner: '', status: 'Draft', createdAt: todayISO() } : undefined)}
          onSave={(f) => { saveFileLink(f); setFileLinkModal({ open: false }); }}
          onCancel={() => setFileLinkModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog open={!!confirm} title="Please confirm" message={confirm?.message ?? ''} confirmLabel="Delete" onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirmDeleteProject} title="Delete project?" message={`Delete "${p.name}" and all its data? This cannot be undone.`} confirmLabel="Delete Project" onConfirm={() => { deleteProject(p.id); navigate('/projects'); }} onCancel={() => setConfirmDeleteProject(false)} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Deliverable Section (inline in Timeline tab)
// ──────────────────────────────────────────────────────────────────────────────

type DSProps = {
  projectId: string;
  projectDeliverables: Deliverable[];
  members: Member[];
};

const DELIVERABLE_TYPES: DeliverableType[] = ['Poster','Video','Caption','Sponsor Proposal','Registration Form','Agenda','Certificate Set','Report','Website Page','Quiz Set','Resource Pack','Other'];
const DELIVERABLE_STATUSES: DeliverableStatus[] = ['Not Started','Drafting','In Review','Changes Requested','Approved','Published','Completed','Archived'];

const DEL_STATUS_COLOR: Record<string, string> = {
  'Not Started': 'text-slate-500',
  Drafting:      'text-blue-400',
  'In Review':   'text-amber-400',
  'Changes Requested': 'text-red-400',
  Approved:      'text-emerald-400',
  Published:     'text-emerald-300',
  Completed:     'text-emerald-400',
  Archived:      'text-slate-600',
};

function DeliverableSection({ projectId, projectDeliverables, members }: DSProps) {
  const { saveDeliverable, deleteDeliverable } = useAppData();
  const [modal, setModal] = React.useState<{ open: boolean; editing?: Deliverable }>({ open: false });
  const [confirmDel, setConfirmDel] = React.useState<Deliverable | null>(null);
  const [form, setForm] = React.useState<Partial<Deliverable>>({});

  function openAdd() { setForm({ projectId, type: 'Poster', status: 'Not Started' }); setModal({ open: true }); }
  function openEdit(d: Deliverable) { setForm(d); setModal({ open: true, editing: d }); }

  function save() {
    if (!form.title?.trim()) return;
    const now = new Date().toISOString();
    const d: Deliverable = modal.editing
      ? { ...modal.editing, ...form, updatedAt: now } as Deliverable
      : { id: generateId(), projectId, title: form.title!, type: form.type ?? 'Other', status: form.status ?? 'Not Started', description: form.description, ownerId: form.ownerId, owner: form.owner, dueDate: form.dueDate, createdAt: now, updatedAt: now };
    const ownerMember = members.find((m) => m.id === d.ownerId);
    if (ownerMember) d.owner = ownerMember.displayName;
    saveDeliverable(d);
    setModal({ open: false });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Package size={14} className="text-slate-400" /> Deliverables</h3>
        <button className="btn-secondary text-xs" onClick={openAdd}><Plus size={13} /> Add Deliverable</button>
      </div>
      {projectDeliverables.length === 0 ? (
        <Card className="py-5 text-center text-slate-500 text-sm">No deliverables yet. Add posters, videos, forms, and reports.</Card>
      ) : (
        <div className="space-y-1.5">
          {projectDeliverables.map((d) => (
            <Card key={d.id} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{d.title}</p>
                    <span className="text-xs text-slate-600">{d.type}</span>
                    <span className={`text-xs font-medium ${DEL_STATUS_COLOR[d.status] ?? 'text-slate-400'}`}>{d.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {d.owner && <span>{d.owner}</span>}
                    {d.dueDate && <span className={isOverdue(d.dueDate) && d.status !== 'Completed' ? 'text-red-400' : ''}>{formatDateShort(d.dueDate)}</span>}
                    {d.description && <span className="truncate italic">{d.description}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <select className="select text-xs py-1 w-32" value={d.status} onChange={(e) => saveDeliverable({ ...d, status: e.target.value as DeliverableStatus, updatedAt: new Date().toISOString() })}>
                    {DELIVERABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="btn-ghost p-1.5" onClick={() => openEdit(d)}><Edit2 size={12} /></button>
                  <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel(d)}><Trash2 size={12} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal.open && (
        <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.editing ? 'Edit Deliverable' : 'Add Deliverable'}>
          <div className="space-y-4">
            <div><label className="field-label">Title</label><input className="input" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Registration Poster" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Type</label>
                <select className="select" value={form.type ?? 'Poster'} onChange={(e) => setForm({ ...form, type: e.target.value as DeliverableType })}>
                  {DELIVERABLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="field-label">Status</label>
                <select className="select" value={form.status ?? 'Not Started'} onChange={(e) => setForm({ ...form, status: e.target.value as DeliverableStatus })}>
                  {DELIVERABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className="field-label">Owner</label>
              <select className="select" value={form.ownerId ?? ''} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">— No owner —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
              </select>
            </div>
            <div><label className="field-label">Due Date</label><input type="date" className="input" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="field-label">Description</label><input className="input" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setModal({ open: false })}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.title?.trim()}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!confirmDel} title="Delete deliverable?" message={`Delete "${confirmDel?.title ?? 'this'}"?`} onConfirm={() => { if (confirmDel) { deleteDeliverable(confirmDel.id); setConfirmDel(null); } }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
