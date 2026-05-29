import { and, eq } from "drizzle-orm";
import { db } from "./client";
import {
  budgetEntries,
  milestones,
  orgRoles,
  projectOrgs,
  projects,
  users,
} from "./schema";
import { computeDaysUntil } from "../lib/health-score";

export type UpdateProjectInput = {
  name?: string;
  color?: string;
  status?: "planning" | "active" | "archived" | "on_hold" | "completed";
  projectType?:
    | "event"
    | "product"
    | "education"
    | "publication"
    | "hackathon"
    | "collaboration"
    | "internal_software";
  startDate?: string | null;
  endDate?: string | null;
  isCollaborative?: boolean;
  canvasX?: number;
  canvasY?: number;
};

export async function updateProjectRecord(
  orgId: string,
  projectId: string,
  input: UpdateProjectInput,
) {
  const existing = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
  if (!existing[0]) return null;

  const patch: Partial<typeof projects.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.color !== undefined) patch.color = input.color;
  if (input.status !== undefined) patch.status = input.status;
  if (input.projectType !== undefined) patch.projectType = input.projectType;
  if (input.startDate !== undefined) patch.startDate = input.startDate;
  if (input.endDate !== undefined) patch.endDate = input.endDate;
  if (input.isCollaborative !== undefined) {
    patch.isCollaborative = input.isCollaborative;
  }
  if (input.canvasX !== undefined) patch.canvasX = input.canvasX;
  if (input.canvasY !== undefined) patch.canvasY = input.canvasY;

  if (Object.keys(patch).length === 0) return existing[0];

  const [row] = await db
    .update(projects)
    .set(patch)
    .where(eq(projects.id, projectId))
    .returning();
  return row ?? null;
}

export async function updateProjectPosition(
  orgId: string,
  projectId: string,
  canvasX: number,
  canvasY: number,
) {
  return updateProjectRecord(orgId, projectId, { canvasX, canvasY });
}

export async function updateMilestonePosition(
  orgId: string,
  milestoneId: string,
  canvasX: number,
  canvasY: number,
) {
  const milestone = await db
    .select({ milestone: milestones, project: projects })
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(
      and(eq(milestones.id, milestoneId), eq(projects.orgId, orgId)),
    );
  if (!milestone[0]) return null;

  const [row] = await db
    .update(milestones)
    .set({ canvasX, canvasY })
    .where(eq(milestones.id, milestoneId))
    .returning();

  if (!row) return null;
  return {
    ...row,
    daysUntil: computeDaysUntil(String(row.date)),
  };
}

export async function deleteMilestoneRecord(orgId: string, milestoneId: string) {
  const milestone = await db
    .select({ milestone: milestones, project: projects })
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(
      and(eq(milestones.id, milestoneId), eq(projects.orgId, orgId)),
    );
  if (!milestone[0]) return null;

  const [row] = await db
    .delete(milestones)
    .where(eq(milestones.id, milestoneId))
    .returning();
  return row ?? null;
}

export async function deleteBudgetEntryRecord(orgId: string, entryId: string) {
  const entry = await db
    .select({ entry: budgetEntries, project: projects })
    .from(budgetEntries)
    .innerJoin(projects, eq(budgetEntries.projectId, projects.id))
    .where(and(eq(budgetEntries.id, entryId), eq(projects.orgId, orgId)));
  if (!entry[0]) return null;

  const [row] = await db
    .delete(budgetEntries)
    .where(eq(budgetEntries.id, entryId))
    .returning();
  return row ?? null;
}

export async function createProjectOrgRecord(
  orgId: string,
  projectId: string,
  orgName: string,
  orgRole: string,
) {
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
  if (!project[0]) return null;

  const [row] = await db
    .insert(projectOrgs)
    .values({
      projectId,
      orgName: orgName.trim(),
      orgRole: orgRole.trim(),
    })
    .returning();
  return row ?? null;
}

export async function deleteProjectOrgRecord(orgId: string, partnerId: string) {
  const partner = await db
    .select({ partner: projectOrgs, project: projects })
    .from(projectOrgs)
    .innerJoin(projects, eq(projectOrgs.projectId, projects.id))
    .where(and(eq(projectOrgs.id, partnerId), eq(projects.orgId, orgId)));
  if (!partner[0]) return null;

  const [row] = await db
    .delete(projectOrgs)
    .where(eq(projectOrgs.id, partnerId))
    .returning();
  return row ?? null;
}

export async function updateUserRecord(
  orgId: string,
  userId: string,
  input: { name?: string; role?: string },
) {
  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.orgId, orgId)));
  if (!existing[0]) return null;

  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) {
    patch.name = input.name.trim();
    patch.initials = input.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }
  if (input.role !== undefined) patch.role = input.role.trim();

  if (Object.keys(patch).length === 0) return existing[0];

  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
    .returning();
  return row ?? null;
}

export async function createOrgRoleRecord(
  orgId: string,
  userId: string,
  title: string,
  rank: number,
  isTeacherInCharge: boolean,
) {
  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.orgId, orgId)));
  if (!user[0]) return null;

  const [row] = await db
    .insert(orgRoles)
    .values({
      orgId,
      userId,
      title: title.trim(),
      rank,
      isTeacherInCharge,
    })
    .returning();
  return row ?? null;
}

export async function deleteOrgRoleRecord(orgId: string, roleId: string) {
  const role = await db
    .select()
    .from(orgRoles)
    .where(and(eq(orgRoles.id, roleId), eq(orgRoles.orgId, orgId)));
  if (!role[0]) return null;

  const [row] = await db
    .delete(orgRoles)
    .where(eq(orgRoles.id, roleId))
    .returning();
  return row ?? null;
}
