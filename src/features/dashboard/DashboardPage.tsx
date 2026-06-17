import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  CheckSquare,
  Megaphone,
  Handshake,
  ArrowRight,
  FolderPlus,
  ListTodo,
  CalendarCheck,
  Wallet,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { User } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import {
  getActiveProjectsCount,
  getOverdueTasks,
  getPendingApprovalPR,
  getSponsorTotals,
  getProjectHealth,
  getNextDeadlines,
  getBudgetSummary,
} from '../../lib/stats';
import { buildAttention } from '../../lib/attention';
import { formatDateShort, formatCurrency, isOverdue } from '../../lib/dateUtils';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import QuickAddMenu from '../../components/QuickAddMenu';

interface Props {
  user: User;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500 truncate">{label}</div>
      </div>
    </Card>
  );
}

const TONE_BORDER: Record<string, string> = {
  danger: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

export default function DashboardPage({ user }: Props) {
  const navigate = useNavigate();
  const { data } = useAppData();
  const { projects, sponsors } = data;

  const overdue = getOverdueTasks(projects);
  const pendingPR = getPendingApprovalPR(projects);
  const pendingApprovals = data.approvals.filter((a) => a.status === 'Submitted');
  const sponsorTotals = getSponsorTotals(sponsors);
  const groups = useMemo(() => buildAttention(data), [data]);

  // Recently viewed projects
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    import('../../lib/recentProjects').then(({ getRecentProjectIds }) => {
      setRecentIds(getRecentProjectIds());
    });
  }, []);
  const recentProjects = recentIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const activeProjects = projects.filter(
    (p) => p.status === 'Active' || p.status === 'Event Week' || p.status === 'Planning'
  );

  // Money Snapshot across all projects
  const moneySnapshot = useMemo(() => {
    let expectedIncome = 0, confirmedIncome = 0, expectedExpense = 0, confirmedExpense = 0, actualIncome = 0, actualExpense = 0, missingReceipts = 0;
    projects.forEach((p) => {
      const s = getBudgetSummary(data, p.id);
      expectedIncome += s.expectedIncome;
      confirmedIncome += s.confirmedIncome;
      expectedExpense += s.expectedExpense;
      confirmedExpense += s.confirmedExpense;
      actualIncome += s.actualIncome;
      actualExpense += s.actualExpense;
      missingReceipts += s.missingReceipts;
    });
    return { expectedIncome, confirmedIncome, expectedExpense, confirmedExpense, actualIncome, actualExpense, missingReceipts };
  }, [data, projects]);

  const quickActions = [
    { label: 'New Project', icon: FolderPlus, onClick: () => navigate('/projects?new=1') },
    { label: 'New Task', icon: ListTodo, onClick: () => navigate('/projects') },
    { label: 'New PR Item', icon: Megaphone, onClick: () => navigate('/pr-planner?new=1') },
    { label: 'New Meeting', icon: CalendarCheck, onClick: () => navigate('/meetings?new=1') },
    { label: 'New Sponsor', icon: Handshake, onClick: () => navigate('/budget?new=1') },
    { label: 'New Transaction', icon: Wallet, onClick: () => navigate('/budget?new=1') },
    { label: 'New Approval', icon: CheckSquare, onClick: () => navigate('/approvals?new=1') },
    { label: 'Generate Report', icon: FileText, onClick: () => navigate('/reports') },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user.displayName.split(' ')[0]}`}
        description="What needs to happen next, who owns it, and when it's due."
        actions={<QuickAddMenu actions={quickActions} />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={FolderKanban} label="Active Projects" value={getActiveProjectsCount(projects)} color="bg-blue-600" onClick={() => navigate('/projects')} />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={overdue.length} color="bg-red-600" onClick={() => navigate('/projects')} />
        <StatCard icon={CheckSquare} label="Pending Approvals" value={pendingApprovals.length + pendingPR.length} color="bg-amber-600" onClick={() => navigate('/approvals')} />
        <StatCard icon={Handshake} label="Confirmed Sponsors" value={formatCurrency(sponsorTotals.confirmed)} color="bg-emerald-600" onClick={() => navigate('/budget')} />
        <StatCard icon={Wallet} label="Sponsor Pipeline" value={formatCurrency(sponsorTotals.pipeline)} color="bg-violet-600" onClick={() => navigate('/budget')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attention Center */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> Attention Center
            </h2>
            <span className="text-xs text-slate-500">{groups.reduce((s, g) => s + g.items.length, 0)} items</span>
          </div>

          {groups.length === 0 ? (
            <Card className="text-center py-10 text-slate-500 text-sm">
              Nothing needs attention right now. Everything is on track.
            </Card>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    {g.label} <span className="text-slate-600">({g.items.length})</span>
                  </p>
                  <div className="space-y-2">
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
                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && <StatusBadge status={item.badge} />}
                          <ChevronRight size={15} className="text-slate-600" />
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
        </div>

        {/* Right column: Project Health + Money Snapshot */}
        <div className="space-y-5">
          {/* Project Health */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Project Health</h2>
            <div className="space-y-2">
              {activeProjects.map((p) => {
                const health = getProjectHealth(p, data);
                const next = getNextDeadlines(p, 1)[0];
                const healthColor =
                  health.label === 'Healthy' ? 'text-emerald-400' : health.label === 'Needs Attention' ? 'text-amber-400' : 'text-red-400';
                return (
                  <Card key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={p.status} />
                          <span className={`text-xs font-medium ${healthColor}`}>{health.label}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 shrink-0 mt-1" />
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar value={p.progress} size="md" showLabel />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {health.overdueCount > 0 && (
                        <span className="text-red-400">{health.overdueCount} overdue</span>
                      )}
                      {health.pendingApprovals > 0 && <span className="text-amber-400">{health.pendingApprovals} approvals</span>}
                      {next && (
                        <span className={isOverdue(next.date) ? 'text-red-400' : ''}>
                          Next: {formatDateShort(next.date)}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
              {activeProjects.length === 0 && (
                <Card className="text-center py-6 text-slate-500 text-sm">No active projects yet.</Card>
              )}
            </div>
          </div>

          {/* Money Snapshot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Wallet size={14} className="text-slate-400" /> Money Snapshot</h2>
              <button onClick={() => navigate('/budget')} className="text-xs text-blue-400 hover:underline">View all</button>
            </div>
            <Card>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><TrendingUp size={12} /> Expected income</span>
                  <span className="text-slate-200 font-medium">{formatCurrency(moneySnapshot.expectedIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Confirmed income</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(moneySnapshot.confirmedIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><TrendingDown size={12} /> Expected expense</span>
                  <span className="text-slate-200 font-medium">{formatCurrency(moneySnapshot.expectedExpense)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Recorded expense</span>
                  <span className="text-red-400 font-medium">{formatCurrency(moneySnapshot.actualExpense)}</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><Handshake size={12} /> Sponsor pipeline</span>
                  <span className="text-amber-400 font-medium">{formatCurrency(sponsorTotals.pipeline)}</span>
                </div>
                {moneySnapshot.missingReceipts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle size={11} /> Missing receipts</span>
                    <span className="text-amber-400 font-medium text-xs">{moneySnapshot.missingReceipts}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Recently Viewed Projects */}
      {recentProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderKanban size={14} className="text-slate-400" /> Recently Viewed
            </h2>
            <button onClick={() => navigate('/projects')} className="text-xs text-blue-400 hover:underline">All projects</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentProjects.map((p) => {
              const health = getProjectHealth(p, data);
              return (
                <Card
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <p className="font-semibold text-sm text-slate-200 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.status} · {p.year}</p>
                  <div className="mt-2">
                    <ProgressBar value={p.progress} size="sm" />
                  </div>
                  <p className={`text-xs mt-1.5 font-medium ${health.label === 'Healthy' ? 'text-emerald-400' : health.label === 'Needs Attention' ? 'text-amber-400' : 'text-red-400'}`}>
                    {health.label}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
