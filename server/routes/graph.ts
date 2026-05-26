import type { FastifyPluginAsync } from "fastify";
import { getOrgGraph } from "../db/queries";

export const graphRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { orgId: string } }>("/:orgId", async (request, reply) => {
    const { orgId } = request.params;
    const graph = await getOrgGraph(orgId);
    if (!graph) {
      return reply.code(404).send({ error: "Org not found" });
    }
    return graph;
  });

  fastify.patch<{
    Params: { taskId: string };
    Body: { status: string };
  }>("/tasks/:taskId/status", async (_request, reply) => {
    return reply.code(501).send({ error: "Not yet implemented — Phase 6" });
  });

  fastify.get<{ Params: { orgId: string } }>(
    "/:orgId/workload",
    async (request, reply) => {
      const graph = await getOrgGraph(request.params.orgId);
      if (!graph) {
        return reply.code(404).send({ error: "Org not found" });
      }

      const users = graph.users.map((u) => {
        const userTasks = graph.tasks.filter((t) =>
          t.assigneeIds.includes(u.id),
        );
        const taskCount = userTasks.length;
        const loadPercent = taskCount * 12.5;
        return {
          userId: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          loadPercent,
          taskCount,
          activeTaskIds: userTasks.map((t) => t.id),
          canvasX: 0,
          canvasY: 0,
        };
      });

      return { users };
    },
  );
};
