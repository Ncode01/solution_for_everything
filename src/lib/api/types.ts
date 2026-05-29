import type {
  BudgetSummary,
  CrossProjectLink,
  Milestone,
  OrgRole,
  ProjectHealthScore,
  ProjectType,
} from "@/types/project-extensions";

export interface OrgGraphResponse {
  org: { id: string; name: string; slug: string };
  users: ApiUser[];
  projects: ApiProject[];
  phases: ApiPhase[];
  tasks: ApiTask[];
  dependencies: ApiDependency[];
  milestones?: ApiMilestone[];
  crossProjectLinks?: ApiCrossProjectLink[];
  budgetByProject?: Record<
    string,
    { entries: ApiBudgetEntry[]; summary: BudgetSummary }
  >;
  partnerOrgsByProject?: Record<string, ApiPartnerOrg[]>;
  orgRoles?: OrgRole[];
  projectHealth?: Record<string, ProjectHealthScore>;
}

export interface ApiBudgetEntry {
  id: string;
  projectId: string;
  label: string;
  type: "income" | "expenditure";
  amount: number;
  confirmed: boolean;
}

export interface ApiPartnerOrg {
  id: string;
  orgName: string;
  orgRole: string;
}

export type ApiMilestone = Milestone;

export interface ApiCrossProjectLink extends CrossProjectLink {}

export interface ApiUser {
  id: string;
  orgId: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface ApiProject {
  id: string;
  orgId: string;
  name: string;
  color: string;
  status: string;
  ownerId: string | null;
  completionPercent: number;
  startDate: string | null;
  endDate: string | null;
  canvasX?: number | null;
  canvasY?: number | null;
  projectType?: ProjectType;
  isCollaborative?: boolean;
}

export interface ApiPhase {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
}

export interface ApiTask {
  id: string;
  phaseId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  effortEstimate: number | null;
  dueDate: string | null;
  canvasX: number;
  canvasY: number;
  assigneeIds: string[];
  dependencies: string[];
  dependents: string[];
}

export interface ApiDependency {
  upstreamTaskId: string;
  downstreamTaskId: string;
  type: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  effortEstimate?: number | null;
  dueDate?: string | null;
  projectId: string;
  phaseId: string;
  assigneeIds?: string[];
  canvasX?: number;
  canvasY?: number;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  effortEstimate?: number | null;
  dueDate?: string | null;
  phaseId?: string;
  assigneeIds?: string[];
  canvasX?: number;
  canvasY?: number;
}

export interface ViewportPayload {
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
}

export interface DomainUser {
  id: string;
  orgId: string;
  name: string;
  initials: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  authUserId: string | null;
  createdAt: string;
}

export interface InviteValidation {
  email: string;
  role: string;
  orgId: string;
  expiresAt: string;
}

export interface CreateInviteResponse {
  inviteUrl: string;
  token: string;
}

export interface UpdateProjectBody {
  name?: string;
  color?: string;
  status?: string;
  projectType?: ProjectType;
  startDate?: string | null;
  endDate?: string | null;
  isCollaborative?: boolean;
  canvasX?: number;
  canvasY?: number;
}

export interface PositionBody {
  canvasX: number;
  canvasY: number;
}

export interface CreateMilestoneBody {
  title: string;
  date: string;
  isHardDeadline?: boolean;
  description?: string | null;
}

export interface CreateBudgetEntryBody {
  label: string;
  type: "income" | "expenditure";
  amount: number;
  confirmed?: boolean;
}

export interface CreateProjectOrgBody {
  projectId: string;
  orgName: string;
  orgRole: string;
}

export interface UpdateUserBody {
  name?: string;
  role?: string;
}

export interface CreateOrgRoleBody {
  userId: string;
  title: string;
  rank: number;
  isTeacherInCharge?: boolean;
}

export type OrgSummary = { id: string; name: string };
