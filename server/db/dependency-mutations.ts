import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { taskDependencies, tasks } from "./schema";
import { wouldIntroduceCycle } from "../lib/cycleCheck";
import { enrichTask } from "./task-mutations";

export async function addTaskDependency(
  taskId: string,
  upstreamTaskId: string,
) {
  if (upstreamTaskId === taskId) {
    throw new Error("A task cannot depend on itself");
  }

  const taskRows = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!taskRows[0] || taskRows[0].archivedAt) {
    return null;
  }

  const allDeps = await db.select().from(taskDependencies);
  if (wouldIntroduceCycle(allDeps, upstreamTaskId, taskId)) {
    throw new Error("Adding this dependency would create a cycle");
  }

  const existing = await db
    .select()
    .from(taskDependencies)
    .where(
      and(
        eq(taskDependencies.upstreamTaskId, upstreamTaskId),
        eq(taskDependencies.downstreamTaskId, taskId),
      ),
    );

  if (!existing[0]) {
    await db.insert(taskDependencies).values({
      upstreamTaskId,
      downstreamTaskId: taskId,
      type: "FS",
    });
  }

  return enrichTask(taskId);
}

export async function removeTaskDependency(
  taskId: string,
  upstreamTaskId: string,
) {
  await db
    .delete(taskDependencies)
    .where(
      and(
        eq(taskDependencies.upstreamTaskId, upstreamTaskId),
        eq(taskDependencies.downstreamTaskId, taskId),
      ),
    );

  return enrichTask(taskId);
}

export async function archiveTaskRecord(taskId: string) {
  const existing = await enrichTask(taskId);
  if (!existing) return null;

  const [updated] = await db
    .update(tasks)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) return null;
  return { ...existing, archivedAt: updated.archivedAt };
}
