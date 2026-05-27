import type {
  OrgGraphResponse,
  CreateTaskBody,
  UpdateTaskBody,
  ApiTask,
  ViewportPayload,
  DomainUser,
  InviteValidation,
  CreateInviteResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
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
};
