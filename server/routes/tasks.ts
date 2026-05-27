import type { FastifyPluginAsync } from "fastify";
import {
  createTaskRecord,
  getTaskById,
  updateTaskRecord,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../db/task-mutations";

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
};
