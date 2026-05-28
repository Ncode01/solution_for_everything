export interface OrgGraphResponse {
  org: { id: string; name: string; slug: string };
  users: ApiUser[];
  projects: ApiProject[];
  phases: ApiPhase[];
  tasks: ApiTask[];
  dependencies: ApiDependency[];
}

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
