import { eq, and, isNull } from "drizzle-orm";
import { db } from "./client";
import { tasks, taskAssignments, taskDependencies } from "./schema";

const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "in_review",
  "done",
] as const;

const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  effortEstimate?: number | null;
  dueDate?: string | null;
  projectId: string;
  phaseId: string;
  assigneeIds?: string[];
  canvasX?: number;
  canvasY?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  effortEstimate?: number | null;
  dueDate?: string | null;
  phaseId?: string;
  assigneeIds?: string[];
}

function assertStatus(value: string): TaskStatus {
  if (!TASK_STATUSES.includes(value as TaskStatus)) {
    throw new Error(`Invalid status: ${value}`);
  }
  return value as TaskStatus;
}

function assertPriority(value: string): TaskPriority {
  if (!TASK_PRIORITIES.includes(value as TaskPriority)) {
    throw new Error(`Invalid priority: ${value}`);
  }
  return value as TaskPriority;
}

export async function createTaskRecord(input: CreateTaskInput) {
  if (!input.title.trim()) throw new Error("Title is required");

  const [row] = await db
    .insert(tasks)
    .values({
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ? assertStatus(input.status) : "not_started",
      priority: input.priority ? assertPriority(input.priority) : "medium",
      effortEstimate: input.effortEstimate ?? null,
      dueDate: input.dueDate ?? null,
      projectId: input.projectId,
      phaseId: input.phaseId,
      canvasX: input.canvasX ?? 400,
      canvasY: input.canvasY ?? 300,
    })
    .returning();

  if (input.assigneeIds?.length) {
    await db.insert(taskAssignments).values(
      input.assigneeIds.map((userId) => ({
        taskId: row.id,
        userId,
      })),
    );
  }

  return enrichTask(row.id);
}

export async function updateTaskRecord(taskId: string, input: UpdateTaskInput) {
  const existing = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!existing[0]) return null;

  const patch: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = assertStatus(input.status);
  if (input.priority !== undefined)
    patch.priority = assertPriority(input.priority);
  if (input.effortEstimate !== undefined)
    patch.effortEstimate = input.effortEstimate;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
  if (input.phaseId !== undefined) patch.phaseId = input.phaseId;

  await db.update(tasks).set(patch).where(eq(tasks.id, taskId));

  if (input.assigneeIds !== undefined) {
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));
    if (input.assigneeIds.length > 0) {
      await db.insert(taskAssignments).values(
        input.assigneeIds.map((userId) => ({
          taskId,
          userId,
        })),
      );
    }
  }

  return enrichTask(taskId);
}

export async function getTaskById(taskId: string) {
  return enrichTask(taskId);
}

export async function enrichTask(taskId: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.archivedAt)));
  const task = rows[0];
  if (!task) return null;

  const assignees = await db
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.taskId, taskId));

  const downstreamDeps = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.downstreamTaskId, taskId));

  const upstreamDeps = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.upstreamTaskId, taskId));

  return {
    ...task,
    assigneeIds: assignees.map((a) => a.userId),
    dependencies: downstreamDeps.map((d) => d.upstreamTaskId),
    dependents: upstreamDeps.map((d) => d.downstreamTaskId),
  };
}
