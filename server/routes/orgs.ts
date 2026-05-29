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
};
