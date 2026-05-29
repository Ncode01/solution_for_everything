export type ProjectType =
  | "event"
  | "product"
  | "education"
  | "publication"
  | "hackathon"
  | "collaboration"
  | "internal_software";

export type BudgetEntry = {
  id: string;
  projectId: string;
  label: string;
  type: "income" | "expenditure";
  amount: number;
  confirmed: boolean;
};

export type BudgetSummary = {
  totalIncome: number;
  totalExpenditure: number;
  surplus: number;
  confirmedIncome: number;
  confirmedExpenditure: number;
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  isHardDeadline: boolean;
  description: string | null;
  canvasX: number | null;
  canvasY: number | null;
  daysUntil: number;
};

export type OrgRole = {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  rank: number;
  isTeacherInCharge: boolean;
};

export type CrossProjectLink = {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  type:
    | "launches_at"
    | "talent_pipeline"
    | "venue_shared"
    | "funds_from"
    | "collaboration";
  note: string | null;
};

export type ProjectHealthScore = {
  score: number;
  grade: "green" | "amber" | "red";
  blockedCriticalTasks: number;
  overdueTaskCount: number;
  budgetBurnPercent: number | null;
  daysToNextMilestone: number | null;
};

export type MilestoneNodeData = {
  milestoneId: string;
  title: string;
  date: string;
  isHardDeadline: boolean;
  daysUntil: number;
  projectColor: string;
};

export type ProjectClusterEnhancements = {
  projectType: ProjectType;
  isCollaborative: boolean;
  health: ProjectHealthScore;
  partnerOrgs: string[];
  budgetSummary: BudgetSummary | null;
  upcomingMilestone: Milestone | null;
};
