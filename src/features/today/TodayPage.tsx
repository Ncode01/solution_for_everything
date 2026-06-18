import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckSquare, Rocket, Handshake, ArrowRight,
  FolderPlus, ListTodo, CalendarCheck, Wallet, ChevronRight,
  TrendingUp, TrendingDown, Sun, Activity, Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import {
  getActiveProjectsCount, getOverdueTasks, getPendingApprovalPR,
  getSponsorTotals, getProjectHealth, getNextDeadlines, getBudgetSummary,
} from '../../lib/stats';
import { buildAttention } from '../../lib/attention';
import { formatDateShort, formatCurrency, isOverdue, isDueSoon, todayISO } from '../../lib/dateUtils';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import QuickAddMenu from '../../components/QuickAddMenu';
import StatCapsule from '../../components/design/StatCapsule';

interface Props {
  user: User;
}

const TONE_BORDER: Record<string, string> = {
  danger:  'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
};

export default function TodayPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();
  const { projects, sponsors, meetings, approvals, transactions } = data;

  const overdue = getOverdueTasks(projects);
  const pendingPR = getPendingApprovalPR(projects);
  const pendingApprovals = approvals.filter((a) => a.status === 'Submitted');
  const sponsorTotals = getSponsorTotals(sponsors);
  const groups = useMemo(() => buildAttention(data), [data]);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    import('../../lib/recentProjects').then(({ getRecentProjectIds }) => {
      setRecentIds(getRecentProjectIds());
    });
  }, []);

  const activeProjects = projects.filter(
    (p) => p.status === 'Active' || p.status === 'Event Week' || p.status === 'Planning'
  );

  const today = todayISO();
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // Due Today
  const dueToday = useMemo(() => {
    const items: Array<{ id: string; title: string; type: string; project: string; projectId?: string; link: string }> = [];
    projects.forEach((p) => {
      p.tasks.forEach((t) => {
        if (t.dueDate === today && t.status !== 'Done' && t.status !== 'Approved') {
          items.push({ id: t.id, title: t.title, type: 'Task', project: p.name, projectId: p.id, link: `/projects/${p.id}` });
        }
      });
      p.milestones.forEach((m) => {
        if (m.dueDate === today && m.status !== 'Completed' && m.status !== 'Cancelled') {
          items.push({ id: m.id, title: m.name, type: 'Milestone', project: p.name, projectId: p.id, link: `/projects/${p.id}` });
        }
      });
      p.prItems.forEach((pr) => {
        if (pr.publishDate === today && pr.publishingStatus !== 'Posted' && pr.publishingStatus !== 'Archived') {
          items.push({ id: pr.id, title: pr.title, type: 'Launch', project: p.name, projectId: p.id, link: '/launches' });
        }
      });
    });
    meetings.forEach((m) => {
      if (m.date === today) {
        items.push({ id: m.id, title: m.title, type: 'Meeting', project: m.projectId ? (projects.find(p => p.id === m.projectId)?.name ?? 'General') : 'General', link: '/meetings' });
      }
    });
    sponsors.forEach((s) => {
      if (s.nextFollowUpDate === today && s.stage !== 'Completed' && s.stage !== 'Rejected') {
        items.push({ id: `fu-${s.id}`, title: `Follow up: ${s.name}`, type: 'Sponsor', project: projects.find(p => p.id === s.projectId)?.name ?? '', link: '/money' });
      }
    });
    return items;
  }, [projects, meetings, sponsors, today]);

  // This Week
  const thisWeek = useMemo(() => {
    const items: Array<{ id: string; title: string; type: string; project: string; date: string; link: string }> = [];
    projects.forEach((p) => {
      p.tasks.forEach((t) => {
        if (t.dueDate > today && t.dueDate <= weekEnd && t.status !== 'Done' && t.status !== 'Approved') {
          items.push({ id: t.id, title: t.title, type: 'Task', project: p.name, date: t.dueDate, link: `/projects/${p.id}` });
        }
      });
      p.milestones.forEach((m) => {
        if (m.dueDate > today && m.dueDate <= weekEnd && m.status !== 'Completed' && m.status !== 'Cancelled') {
          items.push({ id: m.id, title: m.name, type: 'Milestone', project: p.name, date: m.dueDate, link: `/projects/${p.id}` });
        }
      });
    });
    meetings.forEach((m) => {
      if (m.date > today && m.date <= weekEnd) {
        items.push({ id: m.id, title: m.title, type: 'Meeting', project: '', date: m.date, link: '/meetings' });
      }
    });
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  }, [projects, meetings, today, weekEnd]);

  // Money snapshot
  const moneySnapshot = useMemo(() => {
    let expectedIncome = 0, confirmedIncome = 0, expectedExpense = 0, actualExpense = 0;
    let missingReceipts = 0;
    projects.forEach((p) => {
      const s = getBudgetSummary(data, p.id);
      expectedIncome += s.expectedIncome;
      confirmedIncome += s.confirmedIncome;
      expectedExpense += s.expectedExpense;
      actualExpense += s.actualExpense;
      missingReceipts += s.missingReceipts;
    });
    return { expectedIncome, confirmedIncome, expectedExpense, actualExpense, missingReceipts };
  }, [data, projects]);

  const totalAttention = groups.reduce((s, g) => s + g.items.length, 0);

  const quickActions = [
    { label: 'New Project',     icon: FolderPlus,   onClick: () => navigate('/projects?new=1') },
    { label: 'New Task',        icon: ListTodo,      onClick: () => navigate('/projects') },
    { label: 'New Launch',      icon: Rocket,        onClick: () => navigate('/launches?new=1') },
    { label: 'New Meeting',     icon: CalendarCheck, onClick: () => navigate('/meetings?new=1') },
    { label: 'New Sponsor',     icon: Handshake,     onClick: () => navigate('/money?new=1') },
    { label: 'New Transaction', icon: Wallet,        onClick: () => navigate('/money?new=1') },
    { label: 'New Approval',    icon: CheckSquare,   onClick: () => navigate('/approvals?new=1') },
    { label: 'Open Event Day',  icon: Sparkles,      onClick: () => navigate('/event-day') },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="glass-panel-strong rounded-[var(--radius-xl)] p-5 md:p-6">
        <PageHeader
          title={`${greeting}, ${user.displayName.split(' ')[0]}`}
          description={`Today is ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}. What matters now, who owns it, and what happens next.`}
          actions={<QuickAddMenu actions={quickActions} />}
        />
      </div>

      {/* Quick stat bar */}
      <div className="flex flex-wrap gap-3">
        <StatCapsule icon={FolderPlus} label="Active projects" value={getActiveProjectsCount(projects)} tone="blue" onClick={() => navigate('/projects')} />
        <StatCapsule icon={AlertTriangle} label="Needs attention" value={totalAttention} tone={totalAttention > 0 ? 'red' : 'neutral'} />
        <StatCapsule icon={CheckSquare} label="Pending approvals" value={pendingApprovals.length + pendingPR.length} tone="amber" onClick={() => navigate('/approvals')} />
        <StatCapsule icon={Handshake} label="Confirmed sponsors" value={formatCurrency(sponsorTotals.confirmed)} tone="emerald" onClick={() => navigate('/money')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Needs Attention + Due Today + This Week */}
        <div className="lg:col-span-2 space-y-6">

          {/* Needs Attention */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" /> Needs Attention
                {totalAttention > 0 && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">{totalAttention}</span>}
              </h2>
            </div>
            {groups.length === 0 ? (
              <Card className="py-10 text-center">
                <div className="text-slate-500 text-sm">All clear. Nothing needs attention right now.</div>
                <div className="text-slate-600 text-xs mt-1">RCCS is on track.</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.key}>
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${g.tone === 'danger' ? 'bg-red-400' : g.tone === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      {g.label} <span className="text-slate-600 normal-case font-normal">({g.items.length})</span>
                    </p>
                    <div className="space-y-1.5">
                      {g.items.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.link)}
                          className={`w-full text-left bg-slate-900 border border-slate-800 border-l-2 ${TONE_BORDER[g.tone]} rounded-lg px-3 py-2.5 hover:border-slate-700 transition-colors flex items-center justify-between gap-3`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-slate-200 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {item.meta}
                              {item.date && ` · ${formatDateShort(item.date)}`}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            {item.badge && <StatusBadge status={item.badge} />}
                            <ChevronRight size={14} className="text-slate-600" />
                          </div>
                        </button>
                      ))}
                      {g.items.length > 4 && (
                        <button onClick={() => navigate(g.items[0].link)} className="text-xs text-blue-400 hover:underline px-1">
                          +{g.items.length - 4} more
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Due Today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sun size={14} className="text-blue-400" /> Due Today
                {dueToday.length > 0 && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{dueToday.length}</span>}
              </h2>
            </div>
            {dueToday.length === 0 ? (
              <Card className="py-6 text-center text-slate-500 text-sm">Nothing due today.</Card>
            ) : (
              <div className="space-y-1.5">
                {dueToday.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.link)}
                    className="w-full text-left bg-slate-900 border border-slate-800 border-l-2 border-l-blue-500 rounded-lg px-3 py-2.5 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.type} · {item.project}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* This Week */}
          {thisWeek.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity size={14} className="text-slate-400" /> This Week
                </h2>
              </div>
              <div className="space-y-1.5">
                {thisWeek.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.link)}
                    className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.type}{item.project ? ` · ${item.project}` : ''}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{formatDateShort(item.date)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Project Health + Money */}
        <div className="space-y-5">
          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Project Health</h2>
            <div className="space-y-2">
              {activeProjects.map((p) => {
                const health = getProjectHealth(p, data);
                const next = getNextDeadlines(p, 1)[0];
                const hColor = health.label === 'Healthy' ? 'text-emerald-400' : health.label === 'Needs Attention' ? 'text-amber-400' : 'text-red-400';
                return (
                  <Card key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={p.status} />
                          <span className={`text-xs font-medium ${hColor}`}>{health.label}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 shrink-0 mt-1" />
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar value={p.progress} size="md" showLabel />
                    </div>
                    {(health.overdueCount > 0 || health.pendingApprovals > 0 || next) && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {health.overdueCount > 0 && <span className="text-red-400">{health.overdueCount} overdue</span>}
                        {health.pendingApprovals > 0 && <span className="text-amber-400">{health.pendingApprovals} approvals</span>}
                        {next && <span className={isOverdue(next.date) ? 'text-red-400' : ''}>Next: {formatDateShort(next.date)}</span>}
                      </div>
                    )}
                  </Card>
                );
              })}
              {activeProjects.length === 0 && (
                <Card className="text-center py-6 text-slate-500 text-sm">No active projects. Create one to get started.</Card>
              )}
            </div>
          </section>

          {/* Money Snapshot */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Wallet size={14} className="text-slate-400" /> Money</h2>
              <button onClick={() => navigate('/money')} className="text-xs text-blue-400 hover:underline">View all</button>
            </div>
            <Card>
              <div className="space-y-1.5 text-sm">
                <MoneyRow icon={TrendingUp} label="Expected income" value={formatCurrency(moneySnapshot.expectedIncome)} color="text-slate-300" />
                <MoneyRow label="Confirmed income" value={formatCurrency(moneySnapshot.confirmedIncome)} color="text-emerald-400" />
                <MoneyRow icon={TrendingDown} label="Expected expense" value={formatCurrency(moneySnapshot.expectedExpense)} color="text-slate-300" />
                <MoneyRow label="Recorded expense" value={formatCurrency(moneySnapshot.actualExpense)} color="text-red-400" />
                <div className="border-t border-slate-800 pt-1.5 mt-1.5">
                  <MoneyRow icon={Handshake} label="Sponsor pipeline" value={formatCurrency(sponsorTotals.pipeline)} color="text-amber-400" />
                </div>
                {moneySnapshot.missingReceipts > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                    <AlertTriangle size={11} /> {moneySnapshot.missingReceipts} expense{moneySnapshot.missingReceipts > 1 ? 's' : ''} missing receipt
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Recent Activity */}
          <RecentActivity data={data} />
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, accent, onClick }: {
  icon: React.ElementType; label: string; value: string | number;
  accent: 'blue' | 'red' | 'amber' | 'emerald'; onClick: () => void;
}) {
  const colors = {
    blue:    'bg-blue-600/10 border-blue-600/20 text-blue-300',
    red:     'bg-red-600/10 border-red-600/20 text-red-300',
    amber:   'bg-amber-600/10 border-amber-600/20 text-amber-300',
    emerald: 'bg-emerald-600/10 border-emerald-600/20 text-emerald-300',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-opacity-50 text-left w-full ${colors[accent]}`}
    >
      <Icon size={16} className="shrink-0" />
      <div className="min-w-0">
        <div className="text-base font-bold leading-tight">{value}</div>
        <div className="text-xs opacity-70 truncate">{label}</div>
      </div>
    </button>
  );
}

function MoneyRow({ icon: Icon, label, value, color }: {
  icon?: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 flex items-center gap-1 text-xs">
        {Icon && <Icon size={11} />} {label}
      </span>
      <span className={`font-medium text-xs ${color}`}>{value}</span>
    </div>
  );
}

function RecentActivity({ data }: { data: ReturnType<typeof useAppData>['data'] }) {
  const navigate = useNavigate();
  const items = data.activityItems ?? [];
  const recent = [...items].reverse().slice(0, 6);

  if (recent.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Activity size={14} className="text-slate-400" /> Recent Activity
      </h2>
      <div className="space-y-1.5">
        {recent.map((a) => (
          <div key={a.id} className="text-xs text-slate-400 flex items-start gap-2 py-1 border-b border-slate-800/50 last:border-0">
            <span className="text-slate-600 shrink-0 mt-0.5">{new Date(a.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>
            <span className="truncate">{a.summary}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
