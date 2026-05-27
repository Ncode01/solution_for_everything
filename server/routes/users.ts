import type { FastifyPluginAsync } from "fastify";
import { getDomainUserByAuthUserId } from "../db/invite-mutations";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { authUserId?: string } }>(
    "/me",
    async (req, reply) => {
      const authUserId = req.query.authUserId;
      if (!authUserId) {
        return reply.code(400).send({ error: "authUserId query param required" });
      }

      const user = await getDomainUserByAuthUserId(authUserId);
      if (!user) {
        return reply.code(404).send({ error: "Domain user not linked" });
      }

      return user;
    },
  );
};
