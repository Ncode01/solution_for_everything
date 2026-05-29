import { logOnce } from "@/lib/diagnostics";
import type {
  OrgGraphResponse,
  CreateTaskBody,
  UpdateTaskBody,
  ApiTask,
  ViewportPayload,
  DomainUser,
  InviteValidation,
  CreateInviteResponse,
  UpdateProjectBody,
  PositionBody,
  ApiProject,
  ApiMilestone,
  ApiBudgetEntry,
  CreateMilestoneBody,
  CreateBudgetEntryBody,
  CreateProjectOrgBody,
  UpdateUserBody,
  CreateOrgRoleBody,
  ApiUser,
  OrgSummary,
} from "./types";
import type { OrgRole } from "@/types/project-extensions";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  logOnce(
    "api-base-default",
    "[ApiClient] NEXT_PUBLIC_API_URL unset — defaulting to http://localhost:3001",
  );
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    logOnce(
      "api-unauthorized",
      "[ApiClient] 401 UNAUTHORIZED — session may be expired (no page reload)",
    );
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    const message =
      typeof error === "object" && error && "error" in error
        ? String((error as { error: string }).error)
        : `API error ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  getFirstOrg: () => apiFetch<OrgSummary>("/api/orgs/first"),

  getOrgGraph: (orgId: string) =>
    apiFetch<OrgGraphResponse>(`/api/graph/${orgId}`),

  createTask: (body: CreateTaskBody) =>
    apiFetch<ApiTask>(`/api/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateTask: (taskId: string, body: UpdateTaskBody) =>
    apiFetch<ApiTask>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  archiveTask: (taskId: string) =>
    apiFetch<ApiTask>(`/api/tasks/${taskId}`, { method: "DELETE" }),

  addDependency: (taskId: string, upstreamTaskId: string) =>
    apiFetch<{ dependencies: string[]; dependents: string[] }>(
      `/api/tasks/${taskId}/dependencies`,
      {
        method: "POST",
        body: JSON.stringify({ upstreamTaskId }),
      },
    ),

  removeDependency: (taskId: string, upstreamTaskId: string) =>
    apiFetch<{ dependencies: string[]; dependents: string[] }>(
      `/api/tasks/${taskId}/dependencies/${upstreamTaskId}`,
      { method: "DELETE" },
    ),

  getViewport: (orgId: string, authUserId: string) =>
    apiFetch<ViewportPayload>(
      `/api/canvas/viewport/${orgId}?authUserId=${encodeURIComponent(authUserId)}`,
    ),

  saveViewport: (
    orgId: string,
    body: ViewportPayload & { authUserId: string },
  ) =>
    apiFetch<ViewportPayload>(`/api/canvas/viewport/${orgId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateTaskStatus: (taskId: string, status: string) =>
    apiFetch(`/api/graph/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  createInvite: (orgId: string, email: string, role = "member") =>
    apiFetch<CreateInviteResponse>(`/api/invites`, {
      method: "POST",
      body: JSON.stringify({ orgId, email, role }),
    }),

  validateInviteToken: (token: string) =>
    apiFetch<InviteValidation>(`/api/invites/${token}`),

  acceptInvite: (token: string, authUserId: string, name: string) =>
    apiFetch<{ domainUser: DomainUser }>(`/api/invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({ authUserId, name }),
    }),

  getMyDomainUser: (authUserId: string) =>
    apiFetch<DomainUser>(
      `/api/users/me?authUserId=${encodeURIComponent(authUserId)}`,
    ),

  updateProject: (orgId: string, projectId: string, body: UpdateProjectBody) =>
    apiFetch<ApiProject>(`/api/orgs/${orgId}/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  updateProjectPosition: (
    orgId: string,
    projectId: string,
    body: PositionBody,
  ) =>
    apiFetch<{ id: string; canvasX: number | null; canvasY: number | null }>(
      `/api/orgs/${orgId}/projects/${projectId}/position`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  updateMilestonePosition: (
    orgId: string,
    milestoneId: string,
    body: PositionBody,
  ) =>
    apiFetch<{ id: string; canvasX: number | null; canvasY: number | null }>(
      `/api/orgs/${orgId}/milestones/${milestoneId}/position`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),

  createMilestone: (
    orgId: string,
    projectId: string,
    body: CreateMilestoneBody,
  ) =>
    apiFetch<ApiMilestone>(
      `/api/orgs/${orgId}/projects/${projectId}/milestones`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  deleteMilestone: (orgId: string, milestoneId: string) =>
    apiFetch<ApiMilestone>(`/api/orgs/${orgId}/milestones/${milestoneId}`, {
      method: "DELETE",
    }),

  createBudgetEntry: (
    orgId: string,
    projectId: string,
    body: CreateBudgetEntryBody,
  ) =>
    apiFetch<ApiBudgetEntry>(
      `/api/orgs/${orgId}/projects/${projectId}/budget`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  deleteBudgetEntry: (orgId: string, entryId: string) =>
    apiFetch<ApiBudgetEntry>(`/api/orgs/${orgId}/budget-entries/${entryId}`, {
      method: "DELETE",
    }),

  createProjectOrg: (orgId: string, body: CreateProjectOrgBody) =>
    apiFetch<{ id: string; projectId: string; orgName: string; orgRole: string }>(
      `/api/orgs/${orgId}/project-orgs`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  deleteProjectOrg: (orgId: string, partnerId: string) =>
    apiFetch<{ id: string }>(`/api/orgs/${orgId}/project-orgs/${partnerId}`, {
      method: "DELETE",
    }),

  updateUser: (orgId: string, userId: string, body: UpdateUserBody) =>
    apiFetch<ApiUser>(`/api/orgs/${orgId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  createOrgRole: (orgId: string, body: CreateOrgRoleBody) =>
    apiFetch<OrgRole>(`/api/orgs/${orgId}/org-roles`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteOrgRole: (orgId: string, roleId: string) =>
    apiFetch<OrgRole>(`/api/orgs/${orgId}/org-roles/${roleId}`, {
      method: "DELETE",
    }),
};
