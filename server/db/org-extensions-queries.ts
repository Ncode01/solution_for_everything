import { eq, inArray } from "drizzle-orm";
import { db } from "./client";
import {
  budgetEntries,
  crossProjectLinks,
  milestones,
  orgRoles,
  projectOrgs,
  projects,
} from "./schema";
import {
  computeBudgetSummary,
  computeDaysUntil,
  computeProjectHealth,
} from "../lib/health-score";

export async function getOrgExtensionData(orgId: string, projectIds: string[]) {
  const [milestoneRows, budgetRows, partnerRows, linkRows, roleRows] =
    await Promise.all([
      projectIds.length > 0
        ? db
            .select()
            .from(milestones)
            .where(inArray(milestones.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select()
            .from(budgetEntries)
            .where(inArray(budgetEntries.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select()
            .from(projectOrgs)
            .where(inArray(projectOrgs.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select()
            .from(crossProjectLinks)
            .where(inArray(crossProjectLinks.sourceProjectId, projectIds))
        : Promise.resolve([]),
      db.select().from(orgRoles).where(eq(orgRoles.orgId, orgId)),
    ]);

  const today = new Date();

  const enrichedMilestones = milestoneRows.map((m) => ({
    ...m,
    daysUntil: computeDaysUntil(String(m.date), today),
  }));

  const budgetByProject: Record<
    string,
    {
      entries: (typeof budgetRows)[number][];
      summary: ReturnType<typeof computeBudgetSummary>;
    }
  > = {};

  for (const pid of projectIds) {
    const entries = budgetRows.filter((b) => b.projectId === pid);
    budgetByProject[pid] = {
      entries,
      summary: computeBudgetSummary(
        entries.map((e) => ({
          type: e.type as "income" | "expenditure",
          amount: e.amount,
          confirmed: e.confirmed,
        })),
      ),
    };
  }

  const partnerOrgsByProject: Record<string, { orgName: string; orgRole: string }[]> =
    {};
  for (const row of partnerRows) {
    if (!partnerOrgsByProject[row.projectId]) {
      partnerOrgsByProject[row.projectId] = [];
    }
    partnerOrgsByProject[row.projectId].push({
      orgName: row.orgName,
      orgRole: row.orgRole,
    });
  }

  return {
    milestones: enrichedMilestones,
    budgetByProject,
    partnerOrgsByProject,
    crossProjectLinks: linkRows,
    orgRoles: roleRows,
  };
}

export function computeProjectHealthMap(
  projectIds: string[],
  tasks: {
    projectId: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }[],
  milestones: { projectId: string; date: string }[],
  budgetByProject: Record<string, { summary: ReturnType<typeof computeBudgetSummary> }>,
): Record<string, ReturnType<typeof computeProjectHealth>> {
  const result: Record<string, ReturnType<typeof computeProjectHealth>> = {};
  const today = new Date();

  for (const pid of projectIds) {
    const projectTasks = tasks.filter((t) => t.projectId === pid);
    const projectMilestones = milestones.filter((m) => m.projectId === pid);
    const budgetSummary = budgetByProject[pid]?.summary ?? null;

    result[pid] = computeProjectHealth(
      projectTasks.map((t) => ({
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
      projectMilestones.map((m) => ({ date: String(m.date) })),
      budgetSummary,
      today,
    );
  }

  return result;
}

export async function getProjectBudget(projectId: string) {
  const entries = await db
    .select()
    .from(budgetEntries)
    .where(eq(budgetEntries.projectId, projectId));
  const summary = computeBudgetSummary(
    entries.map((e) => ({
      type: e.type as "income" | "expenditure",
      amount: e.amount,
      confirmed: e.confirmed,
    })),
  );
  return { entries, summary };
}

export async function getProjectMilestones(projectId: string) {
  const rows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId));
  const today = new Date();
  return rows.map((m) => ({
    ...m,
    daysUntil: computeDaysUntil(String(m.date), today),
  }));
}

export async function getOrgCrossLinks(orgId: string) {
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.orgId, orgId));
  const projectIds = projectRows.map((p) => p.id);
  if (projectIds.length === 0) return [];

  return db
    .select()
    .from(crossProjectLinks)
    .where(inArray(crossProjectLinks.sourceProjectId, projectIds));
}
