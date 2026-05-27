import type { FastifyRequest, FastifyReply } from "fastify";

export interface SessionUser {
  userId: string;
  email: string;
}

const AUTH_BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

interface BetterAuthSessionResponse {
  user?: {
    id: string;
    email?: string;
  };
}

export async function requireSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser | null> {
  const cookie = req.headers.cookie;
  if (!cookie) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }

  try {
    const res = await fetch(`${AUTH_BASE}/api/auth/get-session`, {
      headers: { cookie },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      reply.code(401).send({ error: "Unauthorized" });
      return null;
    }

    const data = (await res.json()) as BetterAuthSessionResponse | null;
    if (!data?.user?.id) {
      reply.code(401).send({ error: "Unauthorized" });
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email ?? "",
    };
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
}
