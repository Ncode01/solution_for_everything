import type { OrgGraphResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    const message =
      typeof error === "object" && error && "error" in error
        ? String((error as { error: string }).error)
        : `API error ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  getOrgGraph: (orgId: string) =>
    apiFetch<OrgGraphResponse>(`/api/graph/${orgId}`),
  updateTaskStatus: (taskId: string, status: string) =>
    apiFetch(`/api/graph/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
