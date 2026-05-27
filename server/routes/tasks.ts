import type { FastifyPluginAsync } from "fastify";
import {
  createTaskRecord,
  getTaskById,
  updateTaskRecord,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../db/task-mutations";
import {
  addTaskDependency,
  removeTaskDependency,
  archiveTaskRecord,
} from "../db/dependency-mutations";

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { taskId: string } }>("/:taskId", async (req, reply) => {
    const task = await getTaskById(req.params.taskId);
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return task;
  });

  fastify.post<{ Body: CreateTaskInput }>("/", async (req, reply) => {
    try {
      const body = req.body;
      if (!body?.title || !body?.projectId || !body?.phaseId) {
        return reply.code(400).send({
          error: "title, projectId, and phaseId are required",
        });
      }
      const task = await createTaskRecord(body);
      return reply.code(201).send(task);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Create failed";
      return reply.code(400).send({ error: message });
    }
  });

  fastify.patch<{
    Params: { taskId: string };
    Body: UpdateTaskInput;
  }>("/:taskId", async (req, reply) => {
    try {
      const task = await updateTaskRecord(req.params.taskId, req.body ?? {});
      if (!task) return reply.code(404).send({ error: "Task not found" });
      return task;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Update failed";
      return reply.code(400).send({ error: message });
    }
  });

  fastify.delete<{ Params: { taskId: string } }>(
    "/:taskId",
    async (req, reply) => {
      try {
        const task = await archiveTaskRecord(req.params.taskId);
        if (!task) return reply.code(404).send({ error: "Task not found" });
        return task;
      } catch {
        return reply.code(404).send({ error: "Task not found" });
      }
    },
  );

  fastify.post<{
    Params: { taskId: string };
    Body: { upstreamTaskId: string };
  }>("/:taskId/dependencies", async (req, reply) => {
    try {
      const { taskId } = req.params;
      const { upstreamTaskId } = req.body ?? {};
      if (!upstreamTaskId) {
        return reply.code(400).send({ error: "upstreamTaskId is required" });
      }
      const task = await addTaskDependency(taskId, upstreamTaskId);
      if (!task) return reply.code(404).send({ error: "Task not found" });
      return {
        dependencies: task.dependencies,
        dependents: task.dependents,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Add dependency failed";
      return reply.code(400).send({ error: message });
    }
  });

  fastify.delete<{
    Params: { taskId: string; upstreamTaskId: string };
  }>("/:taskId/dependencies/:upstreamTaskId", async (req, reply) => {
    try {
      const { taskId, upstreamTaskId } = req.params;
      const task = await removeTaskDependency(taskId, upstreamTaskId);
      if (!task) return reply.code(404).send({ error: "Task not found" });
      return {
        dependencies: task.dependencies,
        dependents: task.dependents,
      };
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Remove dependency failed";
      return reply.code(400).send({ error: message });
    }
  });
};
