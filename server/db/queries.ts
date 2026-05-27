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
} from "./schema";

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

  return {
    org,
    users: userRows,
    projects: projectRows,
    phases: phaseRows,
    tasks: enrichedTasks,
    dependencies: filteredDepRows,
  };
}
