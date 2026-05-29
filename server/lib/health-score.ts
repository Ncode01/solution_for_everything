/**
 * Server-side mirror of src/lib/health-score.ts (keep algorithms in sync).
 */

export interface HealthScoreTask {
  status: string;
  priority: string;
  dueDate?: string | Date | null;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenditure: number;
  surplus: number;
  confirmedIncome: number;
  confirmedExpenditure: number;
}

export interface MilestoneDate {
  date: string;
}

export interface ProjectHealthScore {
  score: number;
  grade: "green" | "amber" | "red";
  blockedCriticalTasks: number;
  overdueTaskCount: number;
  budgetBurnPercent: number | null;
  daysToNextMilestone: number | null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDueDate(dueDate: string | Date): Date {
  if (dueDate instanceof Date) return startOfDay(dueDate);
  return startOfDay(new Date(`${dueDate}T00:00:00`));
}

export function computeProjectHealth(
  tasks: HealthScoreTask[],
  milestones: MilestoneDate[],
  budgetSummary: BudgetSummary | null,
  today: Date = new Date(),
): ProjectHealthScore {
  const todayStart = startOfDay(today);

  const blockedCriticalTasks = tasks.filter(
    (t) => t.status === "blocked" && t.priority === "critical",
  ).length;
  const criticalPathBlockedPenalty = Math.min(blockedCriticalTasks * 15, 45);

  const overdueTaskCount = tasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    return parseDueDate(t.dueDate) < todayStart;
  }).length;
  const overduePenalty = Math.min(overdueTaskCount * 8, 30);

  const budgetBurnPercent =
    budgetSummary && budgetSummary.totalIncome > 0
      ? (budgetSummary.totalExpenditure / budgetSummary.totalIncome) * 100
      : null;

  const budgetPenalty =
    budgetBurnPercent !== null && budgetBurnPercent > 90 ? 15 : 0;

  const score = Math.max(
    0,
    100 - criticalPathBlockedPenalty - overduePenalty - budgetPenalty,
  );

  const grade: ProjectHealthScore["grade"] =
    score >= 70 ? "green" : score >= 40 ? "amber" : "red";

  let daysToNextMilestone: number | null = null;
  const futureMilestones = milestones
    .map((m) => ({
      days: Math.ceil(
        (parseDueDate(m.date).getTime() - todayStart.getTime()) / 86_400_000,
      ),
    }))
    .filter((m) => m.days >= 0)
    .sort((a, b) => a.days - b.days);

  if (futureMilestones.length > 0) {
    daysToNextMilestone = futureMilestones[0].days;
  }

  return {
    score,
    grade,
    blockedCriticalTasks,
    overdueTaskCount,
    budgetBurnPercent,
    daysToNextMilestone,
  };
}

export function computeBudgetSummary(
  entries: { type: "income" | "expenditure"; amount: number; confirmed: boolean }[],
): BudgetSummary {
  let totalIncome = 0;
  let totalExpenditure = 0;
  let confirmedIncome = 0;
  let confirmedExpenditure = 0;

  for (const e of entries) {
    if (e.type === "income") {
      totalIncome += e.amount;
      if (e.confirmed) confirmedIncome += e.amount;
    } else {
      totalExpenditure += e.amount;
      if (e.confirmed) confirmedExpenditure += e.amount;
    }
  }

  return {
    totalIncome,
    totalExpenditure,
    surplus: totalIncome - totalExpenditure,
    confirmedIncome,
    confirmedExpenditure,
  };
}

export function computeDaysUntil(date: string, today: Date = new Date()): number {
  const todayStart = startOfDay(today);
  const target = parseDueDate(date);
  return Math.ceil((target.getTime() - todayStart.getTime()) / 86_400_000);
}
