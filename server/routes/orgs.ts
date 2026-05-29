import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { budgetEntries, milestones, organizations, projects } from "../db/schema";
import { getOrgGraph } from "../db/queries";
import {
  getOrgCrossLinks,
  getProjectBudget,
  getProjectMilestones,
} from "../db/org-extensions-queries";
import {
  createOrgRoleRecord,
  createProjectOrgRecord,
  deleteBudgetEntryRecord,
  deleteMilestoneRecord,
  deleteOrgRoleRecord,
  deleteProjectOrgRecord,
  updateMilestonePosition,
  updateProjectPosition,
  updateProjectRecord,
  updateUserRecord,
  type UpdateProjectInput,
} from "../db/project-mutations";
import { requireSession } from "../lib/auth";
import { computeDaysUntil } from "../lib/health-score";

export const orgRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { orgId: string } }>(
    "/:orgId/canvas-data",
    async (request, reply) => {
      const graph = await getOrgGraph(request.params.orgId);
      if (!graph) {
        return reply.code(404).send({ error: "Org not found" });
      }
      return graph;
    },
  );

  fastify.get<{ Params: { orgId: string } }>(
    "/:orgId/projects/cross-links",
    async (request, reply) => {
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, request.params.orgId));
      if (!org[0]) {
        return reply.code(404).send({ error: "Org not found" });
      }
      const links = await getOrgCrossLinks(request.params.orgId);
      return { links };
    },
  );

  fastify.get<{
    Params: { orgId: string; projectId: string };
  }>("/:orgId/projects/:projectId/budget", async (request, reply) => {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.params.projectId));
    if (!project[0] || project[0].orgId !== request.params.orgId) {
      return reply.code(404).send({ error: "Project not found" });
    }
    return getProjectBudget(request.params.projectId);
  });

  fastify.post<{
    Params: { orgId: string; projectId: string };
    Body: {
      label?: string;
      type?: "income" | "expenditure";
      amount?: number;
      confirmed?: boolean;
    };
  }>("/:orgId/projects/:projectId/budget", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.params.projectId));
    if (!project[0] || project[0].orgId !== request.params.orgId) {
      return reply.code(404).send({ error: "Project not found" });
    }

    const { label, type, amount, confirmed } = request.body ?? {};
    if (!label?.trim() || !type || amount === undefined) {
      return reply
        .code(400)
        .send({ error: "label, type, and amount are required" });
    }

    const [row] = await db
      .insert(budgetEntries)
      .values({
        projectId: request.params.projectId,
        label: label.trim(),
        type,
        amount,
        confirmed: confirmed ?? false,
      })
      .returning();

    return reply.code(201).send(row);
  });

  fastify.get<{
    Params: { orgId: string; projectId: string };
  }>("/:orgId/projects/:projectId/milestones", async (request, reply) => {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.params.projectId));
    if (!project[0] || project[0].orgId !== request.params.orgId) {
      return reply.code(404).send({ error: "Project not found" });
    }
    const items = await getProjectMilestones(request.params.projectId);
    return { milestones: items };
  });

  fastify.post<{
    Params: { orgId: string; projectId: string };
    Body: {
      title?: string;
      date?: string;
      isHardDeadline?: boolean;
      description?: string | null;
    };
  }>("/:orgId/projects/:projectId/milestones", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.params.projectId));
    if (!project[0] || project[0].orgId !== request.params.orgId) {
      return reply.code(404).send({ error: "Project not found" });
    }

    const { title, date, isHardDeadline, description } = request.body ?? {};
    if (!title?.trim() || !date) {
      return reply.code(400).send({ error: "title and date are required" });
    }

    const [row] = await db
      .insert(milestones)
      .values({
        projectId: request.params.projectId,
        title: title.trim(),
        date,
        isHardDeadline: isHardDeadline ?? true,
        description: description ?? null,
      })
      .returning();

    return reply.code(201).send({
      ...row,
      daysUntil: computeDaysUntil(String(row.date)),
    });
  });

  fastify.patch<{
    Params: { orgId: string; projectId: string };
    Body: {
      name?: string;
      color?: string;
      status?: string;
      projectType?: string;
      startDate?: string | null;
      endDate?: string | null;
      isCollaborative?: boolean;
      canvasX?: number;
      canvasY?: number;
    };
  }>("/:orgId/projects/:projectId", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const body = request.body ?? {};
    const row = await updateProjectRecord(
      request.params.orgId,
      request.params.projectId,
      {
        name: body.name,
        color: body.color,
        status: body.status as UpdateProjectInput["status"],
        projectType: body.projectType as UpdateProjectInput["projectType"],
        startDate: body.startDate,
        endDate: body.endDate,
        isCollaborative: body.isCollaborative,
        canvasX: body.canvasX,
        canvasY: body.canvasY,
      },
    );
    if (!row) {
      return reply.code(404).send({ error: "Project not found" });
    }
    return row;
  });

  fastify.patch<{
    Params: { orgId: string; projectId: string };
    Body: { canvasX?: number; canvasY?: number };
  }>("/:orgId/projects/:projectId/position", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const { canvasX, canvasY } = request.body ?? {};
    if (canvasX === undefined || canvasY === undefined) {
      return reply
        .code(400)
        .send({ error: "canvasX and canvasY are required" });
    }

    const row = await updateProjectPosition(
      request.params.orgId,
      request.params.projectId,
      canvasX,
      canvasY,
    );
    if (!row) {
      return reply.code(404).send({ error: "Project not found" });
    }
    return {
      id: row.id,
      canvasX: row.canvasX,
      canvasY: row.canvasY,
    };
  });

  fastify.patch<{
    Params: { orgId: string; milestoneId: string };
    Body: { canvasX?: number; canvasY?: number };
  }>("/:orgId/milestones/:milestoneId/position", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const { canvasX, canvasY } = request.body ?? {};
    if (canvasX === undefined || canvasY === undefined) {
      return reply
        .code(400)
        .send({ error: "canvasX and canvasY are required" });
    }

    const row = await updateMilestonePosition(
      request.params.orgId,
      request.params.milestoneId,
      canvasX,
      canvasY,
    );
    if (!row) {
      return reply.code(404).send({ error: "Milestone not found" });
    }
    return {
      id: row.id,
      canvasX: row.canvasX,
      canvasY: row.canvasY,
    };
  });

  fastify.delete<{
    Params: { orgId: string; milestoneId: string };
  }>("/:orgId/milestones/:milestoneId", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const row = await deleteMilestoneRecord(
      request.params.orgId,
      request.params.milestoneId,
    );
    if (!row) {
      return reply.code(404).send({ error: "Milestone not found" });
    }
    return row;
  });

  fastify.delete<{
    Params: { orgId: string; entryId: string };
  }>("/:orgId/budget-entries/:entryId", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const row = await deleteBudgetEntryRecord(
      request.params.orgId,
      request.params.entryId,
    );
    if (!row) {
      return reply.code(404).send({ error: "Budget entry not found" });
    }
    return row;
  });

  fastify.post<{
    Params: { orgId: string };
    Body: { projectId?: string; orgName?: string; orgRole?: string };
  }>("/:orgId/project-orgs", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const { projectId, orgName, orgRole } = request.body ?? {};
    if (!projectId?.trim() || !orgName?.trim() || !orgRole?.trim()) {
      return reply
        .code(400)
        .send({ error: "projectId, orgName, and orgRole are required" });
    }

    const row = await createProjectOrgRecord(
      request.params.orgId,
      projectId,
      orgName,
      orgRole,
    );
    if (!row) {
      return reply.code(404).send({ error: "Project not found" });
    }
    return reply.code(201).send(row);
  });

  fastify.delete<{
    Params: { orgId: string; id: string };
  }>("/:orgId/project-orgs/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const row = await deleteProjectOrgRecord(
      request.params.orgId,
      request.params.id,
    );
    if (!row) {
      return reply.code(404).send({ error: "Partner org not found" });
    }
    return row;
  });

  fastify.patch<{
    Params: { orgId: string; userId: string };
    Body: { name?: string; role?: string };
  }>("/:orgId/users/:userId", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const row = await updateUserRecord(
      request.params.orgId,
      request.params.userId,
      request.body ?? {},
    );
    if (!row) {
      return reply.code(404).send({ error: "User not found" });
    }
    return row;
  });

  fastify.post<{
    Params: { orgId: string };
    Body: {
      userId?: string;
      title?: string;
      rank?: number;
      isTeacherInCharge?: boolean;
    };
  }>("/:orgId/org-roles", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const { userId, title, rank, isTeacherInCharge } = request.body ?? {};
    if (!userId?.trim() || !title?.trim() || rank === undefined) {
      return reply
        .code(400)
        .send({ error: "userId, title, and rank are required" });
    }
    if (rank < 1 || rank > 99) {
      return reply.code(422).send({ error: "rank must be between 1 and 99" });
    }

    const row = await createOrgRoleRecord(
      request.params.orgId,
      userId,
      title,
      rank,
      isTeacherInCharge ?? false,
    );
    if (!row) {
      return reply.code(404).send({ error: "User not found" });
    }
    return reply.code(201).send(row);
  });

  fastify.delete<{
    Params: { orgId: string; id: string };
  }>("/:orgId/org-roles/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const row = await deleteOrgRoleRecord(
      request.params.orgId,
      request.params.id,
    );
    if (!row) {
      return reply.code(404).send({ error: "Org role not found" });
    }
    return row;
  });
};
