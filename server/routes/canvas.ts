import type { FastifyPluginAsync } from "fastify";
import { getViewport, upsertViewport } from "../db/viewport-queries";

export const canvasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { orgId: string };
    Querystring: { authUserId?: string };
  }>("/viewport/:orgId", async (req, reply) => {
    const { orgId } = req.params;
    const authUserId = req.query.authUserId;
    if (!authUserId) {
      return reply.code(400).send({ error: "authUserId query param required" });
    }
    const row = await getViewport(orgId, authUserId);
    if (!row) return reply.code(404).send({ error: "No saved viewport" });
    return {
      viewportX: row.viewportX,
      viewportY: row.viewportY,
      viewportZoom: row.viewportZoom,
    };
  });

  fastify.put<{
    Params: { orgId: string };
    Body: {
      viewportX: number;
      viewportY: number;
      viewportZoom: number;
      authUserId: string;
    };
  }>("/viewport/:orgId", async (req, reply) => {
    const { orgId } = req.params;
    const { viewportX, viewportY, viewportZoom, authUserId } = req.body ?? {};

    if (
      authUserId === undefined ||
      viewportX === undefined ||
      viewportY === undefined ||
      viewportZoom === undefined
    ) {
      return reply.code(400).send({
        error: "authUserId, viewportX, viewportY, viewportZoom required",
      });
    }

    const row = await upsertViewport(orgId, authUserId, {
      viewportX,
      viewportY,
      viewportZoom,
    });
    return {
      viewportX: row.viewportX,
      viewportY: row.viewportY,
      viewportZoom: row.viewportZoom,
    };
  });
};
