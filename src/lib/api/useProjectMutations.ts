"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { computeBudgetSummary } from "@/lib/health-score";
import type {
  ApiBudgetEntry,
  ApiMilestone,
  ApiProject,
  ApiUser,
  CreateBudgetEntryBody,
  CreateMilestoneBody,
  CreateOrgRoleBody,
  CreateProjectOrgBody,
  OrgGraphResponse,
  UpdateProjectBody,
  UpdateUserBody,
} from "./types";
import type { OrgRole } from "@/types/project-extensions";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

type GraphCtx = { previous?: OrgGraphResponse };

function isPositionOnlyProjectBody(body: UpdateProjectBody): boolean {
  const keys = Object.keys(body);
  return (
    keys.length > 0 && keys.every((k) => k === "canvasX" || k === "canvasY")
  );
}

export function useUpdateProjectMutation(
  options?: UseMutationOptions<
    ApiProject,
    Error,
    { projectId: string; body: UpdateProjectBody },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useMutation({
    mutationFn: ({ projectId, body }) =>
      apiClient.updateProject(ORG_ID, projectId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          projects: previous.projects.map((p) => {
            if (p.id !== vars.projectId) return p;
            return {
              ...p,
              name: vars.body.name ?? p.name,
              color: vars.body.color ?? p.color,
              status: vars.body.status ?? p.status,
              projectType: vars.body.projectType ?? p.projectType,
              startDate:
                vars.body.startDate !== undefined
                  ? vars.body.startDate
                  : p.startDate,
              endDate:
                vars.body.endDate !== undefined ? vars.body.endDate : p.endDate,
              isCollaborative:
                vars.body.isCollaborative ?? p.isCollaborative,
              canvasX: vars.body.canvasX ?? p.canvasX,
              canvasY: vars.body.canvasY ?? p.canvasY,
            };
          }),
        });
      }

      if (vars.body.name || vars.body.color || vars.body.status) {
        setNodes((nodes) =>
          nodes.map((n) => {
            if (n.id !== `project-${vars.projectId}`) return n;
            const data = n.data as Record<string, unknown>;
            const project = data.project as Record<string, unknown>;
            return {
              ...n,
              data: {
                ...data,
                project: {
                  ...project,
                  name: vars.body.name ?? project.name,
                  color: vars.body.color ?? project.color,
                  status: vars.body.status ?? project.status,
                },
                projectType: vars.body.projectType ?? data.projectType,
                isCollaborative:
                  vars.body.isCollaborative ?? data.isCollaborative,
              },
            };
          }),
        );
      }

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSuccess: (data, vars, onMutateResult, ctx) => {
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          projects: previous.projects.map((p) =>
            p.id === vars.projectId ? { ...p, ...data } : p,
          ),
        });
      }
      options?.onSuccess?.(data, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      if (!isPositionOnlyProjectBody(vars.body)) {
        void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      }
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useArchiveProjectMutation(
  options?: UseMutationOptions<
    ApiProject,
    Error,
    string,
    GraphCtx & { previousNodes?: ReturnType<typeof useCanvasStore.getState>["nodes"] }
  >,
) {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useMutation({
    mutationFn: (projectId) =>
      apiClient.updateProject(ORG_ID, projectId, { status: "archived" }),
    ...options,
    onMutate: async (projectId, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const previousNodes = useCanvasStore.getState().nodes;

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          projects: previous.projects.filter((p) => p.id !== projectId),
        });
      }

      setNodes((nodes) =>
        nodes.filter((n) => !n.id.startsWith(`project-${projectId}`)),
      );

      const ctx = { previous, previousNodes };
      return (await options?.onMutate?.(projectId, context)) ?? ctx;
    },
    onError: (err, projectId, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      if (onMutateResult?.previousNodes) {
        setNodes(onMutateResult.previousNodes);
      }
      options?.onError?.(err, projectId, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useCreateMilestoneMutation(
  options?: UseMutationOptions<
    ApiMilestone,
    Error,
    { projectId: string; body: CreateMilestoneBody },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, body }) =>
      apiClient.createMilestone(ORG_ID, projectId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useDeleteMilestoneMutation(
  options?: UseMutationOptions<ApiMilestone, Error, string, GraphCtx>,
) {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useMutation({
    mutationFn: (milestoneId) =>
      apiClient.deleteMilestone(ORG_ID, milestoneId),
    ...options,
    onMutate: async (milestoneId, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          milestones: (previous.milestones ?? []).filter(
            (m) => m.id !== milestoneId,
          ),
        });
      }

      setNodes((nodes) =>
        nodes.filter((n) => n.id !== `milestone-${milestoneId}`),
      );

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(milestoneId, context)) ?? ctx;
    },
    onError: (err, milestoneId, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, milestoneId, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useCreateBudgetEntryMutation(
  options?: UseMutationOptions<
    ApiBudgetEntry,
    Error,
    { projectId: string; body: CreateBudgetEntryBody },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, body }) =>
      apiClient.createBudgetEntry(ORG_ID, projectId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        const tempEntry: ApiBudgetEntry = {
          id: `temp-${Date.now()}`,
          projectId: vars.projectId,
          label: vars.body.label,
          type: vars.body.type,
          amount: vars.body.amount,
          confirmed: vars.body.confirmed ?? false,
        };
        const existing = previous.budgetByProject?.[vars.projectId];
        const entries = [...(existing?.entries ?? []), tempEntry];
        const summary = computeBudgetSummary(entries);
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          budgetByProject: {
            ...previous.budgetByProject,
            [vars.projectId]: { entries, summary },
          },
        });
      }

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useDeleteBudgetEntryMutation(
  options?: UseMutationOptions<
    ApiBudgetEntry,
    Error,
    { projectId: string; entryId: string },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId }) =>
      apiClient.deleteBudgetEntry(ORG_ID, entryId),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        const existing = previous.budgetByProject?.[vars.projectId];
        const entries = (existing?.entries ?? []).filter(
          (e) => e.id !== vars.entryId,
        );
        const summary = computeBudgetSummary(entries);
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          budgetByProject: {
            ...previous.budgetByProject,
            [vars.projectId]: { entries, summary },
          },
        });
      }

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useCreateProjectOrgMutation(
  options?: UseMutationOptions<
    { id: string; projectId: string; orgName: string; orgRole: string },
    Error,
    CreateProjectOrgBody,
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => apiClient.createProjectOrg(ORG_ID, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useDeleteProjectOrgMutation(
  options?: UseMutationOptions<
    { id: string },
    Error,
    { projectId: string; partnerId: string },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partnerId }) =>
      apiClient.deleteProjectOrg(ORG_ID, partnerId),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        const partners = previous.partnerOrgsByProject?.[vars.projectId] ?? [];
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          partnerOrgsByProject: {
            ...previous.partnerOrgsByProject,
            [vars.projectId]: partners.filter((p) => p.id !== vars.partnerId),
          },
        });
      }

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useUpdateUserMutation(
  options?: UseMutationOptions<
    ApiUser,
    Error,
    { userId: string; body: UpdateUserBody },
    GraphCtx
  >,
) {
  const queryClient = useQueryClient();
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useMutation({
    mutationFn: ({ userId, body }) =>
      apiClient.updateUser(ORG_ID, userId, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          users: previous.users.map((u) => {
            if (u.id !== vars.userId) return u;
            return {
              ...u,
              name: vars.body.name ?? u.name,
              role: vars.body.role ?? u.role,
              initials: vars.body.name
                ? vars.body.name
                    .split(/\s+/)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .join("")
                    .slice(0, 2)
                : u.initials,
            };
          }),
        });
      }

      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id !== `person-${vars.userId}`) return n;
          const data = n.data as { user: ApiUser; [key: string]: unknown };
          return {
            ...n,
            data: {
              ...data,
              user: {
                ...data.user,
                name: vars.body.name ?? data.user.name,
                role: vars.body.role ?? data.user.role,
                initials: vars.body.name
                  ? vars.body.name
                      .split(/\s+/)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("")
                      .slice(0, 2)
                  : data.user.initials,
              },
            },
          };
        }),
      );

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useCreateOrgRoleMutation(
  options?: UseMutationOptions<OrgRole, Error, CreateOrgRoleBody, GraphCtx>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => apiClient.createOrgRole(ORG_ID, body),
    ...options,
    onMutate: async (vars, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);
      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(vars, context)) ?? ctx;
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, vars, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}

export function useDeleteOrgRoleMutation(
  options?: UseMutationOptions<OrgRole, Error, string, GraphCtx>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId) => apiClient.deleteOrgRole(ORG_ID, roleId),
    ...options,
    onMutate: async (roleId, context) => {
      await queryClient.cancelQueries({ queryKey: ["org-graph", ORG_ID] });
      const previous = queryClient.getQueryData<OrgGraphResponse>([
        "org-graph",
        ORG_ID,
      ]);

      if (previous) {
        queryClient.setQueryData<OrgGraphResponse>(["org-graph", ORG_ID], {
          ...previous,
          orgRoles: (previous.orgRoles ?? []).filter((r) => r.id !== roleId),
        });
      }

      const ctx: GraphCtx = { previous };
      return (await options?.onMutate?.(roleId, context)) ?? ctx;
    },
    onError: (err, roleId, onMutateResult, ctx) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(["org-graph", ORG_ID], onMutateResult.previous);
      }
      options?.onError?.(err, roleId, onMutateResult, ctx);
    },
    onSettled: (data, err, vars, onMutateResult, ctx) => {
      void queryClient.invalidateQueries({ queryKey: ["org-graph", ORG_ID] });
      options?.onSettled?.(data, err, vars, onMutateResult, ctx);
    },
  });
}
