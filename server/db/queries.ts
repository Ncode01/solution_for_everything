import { eq, inArray, and, isNull } from "drizzle-orm";
import { db } from "./client";
import {
  organizations,
  users,
  projects,
  phases,
  tasks,
  taskAssignments,
  taskDependencies,
  posters,
  networkSchools,
  externalCollaborators,
} from "./schema";
import {
  computeProjectHealthMap,
  getOrgExtensionData,
} from "./org-extensions-queries";

export async function getOrgGraph(orgId: string) {
  const orgRows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  const org = orgRows[0];
  if (!org) return null;

  const userRows = await db.select().from(users).where(eq(users.orgId, orgId));
  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.orgId, orgId));
  const projectIds = projectRows.map((p) => p.id);

  const phaseRows =
    projectIds.length > 0
      ? await db
          .select()
          .from(phases)
          .where(inArray(phases.projectId, projectIds))
      : [];

  const taskRows =
    projectIds.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(
            and(
              inArray(tasks.projectId, projectIds),
              isNull(tasks.archivedAt),
            ),
          )
      : [];

  const taskIds = taskRows.map((t) => t.id);

  const assigneeRows =
    taskIds.length > 0
      ? await db
          .select()
          .from(taskAssignments)
          .where(inArray(taskAssignments.taskId, taskIds))
      : [];

  const depRows =
    taskIds.length > 0
      ? await db.select().from(taskDependencies)
      : [];

  const filteredDepRows = depRows.filter(
    (d) =>
      taskIds.includes(d.upstreamTaskId) ||
      taskIds.includes(d.downstreamTaskId),
  );

  const taskAssigneeMap: Record<string, string[]> = {};
  for (const a of assigneeRows) {
    if (!taskAssigneeMap[a.taskId]) taskAssigneeMap[a.taskId] = [];
    taskAssigneeMap[a.taskId].push(a.userId);
  }

  const dependenciesMap: Record<string, string[]> = {};
  const dependentsMap: Record<string, string[]> = {};
  for (const dep of filteredDepRows) {
    if (!dependenciesMap[dep.downstreamTaskId]) {
      dependenciesMap[dep.downstreamTaskId] = [];
    }
    dependenciesMap[dep.downstreamTaskId].push(dep.upstreamTaskId);
    if (!dependentsMap[dep.upstreamTaskId]) {
      dependentsMap[dep.upstreamTaskId] = [];
    }
    dependentsMap[dep.upstreamTaskId].push(dep.downstreamTaskId);
  }

  const enrichedTasks = taskRows.map((t) => ({
    ...t,
    assigneeIds: taskAssigneeMap[t.id] ?? [],
    dependencies: dependenciesMap[t.id] ?? [],
    dependents: dependentsMap[t.id] ?? [],
  }));

  const [posterRows, schoolRows, collabRows] = await Promise.all([
    db.select().from(posters).where(eq(posters.orgId, orgId)),
    db.select().from(networkSchools).where(eq(networkSchools.orgId, orgId)),
    db
      .select()
      .from(externalCollaborators)
      .where(eq(externalCollaborators.orgId, orgId)),
  ]);

  const extensions = await getOrgExtensionData(orgId, projectIds);
  const projectHealth = computeProjectHealthMap(
    projectIds,
    enrichedTasks.map((t) => ({
      projectId: t.projectId,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
    extensions.milestones.map((m) => ({
      projectId: m.projectId,
      date: String(m.date),
    })),
    extensions.budgetByProject,
  );

  return {
    org,
    users: userRows,
    projects: projectRows,
    phases: phaseRows,
    tasks: enrichedTasks,
    dependencies: filteredDepRows,
    milestones: extensions.milestones,
    crossProjectLinks: extensions.crossProjectLinks,
    budgetByProject: extensions.budgetByProject,
    partnerOrgsByProject: extensions.partnerOrgsByProject,
    orgRoles: extensions.orgRoles,
    projectHealth,
    posters: posterRows.map((p) => ({
      ...p,
      tags: p.tags ?? [],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    schools: schoolRows.map((s) => ({
      ...s,
      projectIds: s.projectIds ?? [],
      createdAt: s.createdAt.toISOString(),
    })),
    externalCollaborators: collabRows.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
