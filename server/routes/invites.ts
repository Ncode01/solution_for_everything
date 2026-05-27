import type { FastifyPluginAsync } from "fastify";
import { requireSession } from "../lib/auth";
import {
  acceptInviteRecord,
  createInviteRecord,
  getInviteByToken,
  isInviteValid,
} from "../db/invite-mutations";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const inviteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      orgId?: string;
      email?: string;
      role?: string;
      createdBy?: string;
    };
  }>("/", async (req, reply) => {
    const session = await requireSession(req, reply);
    if (!session) return;

    const { orgId, email, role, createdBy } = req.body ?? {};
    if (!orgId || !email?.trim()) {
      return reply.code(400).send({ error: "orgId and email are required" });
    }

    try {
      const invite = await createInviteRecord({
        orgId,
        email,
        role,
        createdBy: createdBy ?? null,
      });
      const inviteUrl = `${APP_URL}/invite/${invite.token}`;
      return reply.code(201).send({ invite, inviteUrl, token: invite.token });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Create invite failed";
      return reply.code(400).send({ error: message });
    }
  });

  fastify.get<{ Params: { token: string } }>("/:token", async (req, reply) => {
    const invite = await getInviteByToken(req.params.token);
    if (!invite || !isInviteValid(invite)) {
      return reply.code(404).send({ error: "Invite not found or expired" });
    }
    return {
      email: invite.email,
      role: invite.role,
      orgId: invite.orgId,
      expiresAt: invite.expiresAt,
    };
  });

  fastify.post<{
    Params: { token: string };
    Body: { authUserId?: string; name?: string };
  }>("/:token/accept", async (req, reply) => {
    const { authUserId, name } = req.body ?? {};
    if (!authUserId || !name?.trim()) {
      return reply
        .code(400)
        .send({ error: "authUserId and name are required" });
    }

    try {
      const domainUser = await acceptInviteRecord(
        req.params.token,
        authUserId,
        name,
      );
      if (!domainUser) {
        return reply.code(404).send({ error: "Invite not found or expired" });
      }
      return { domainUser };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Accept failed";
      return reply.code(400).send({ error: message });
    }
  });
};
