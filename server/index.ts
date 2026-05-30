import { config } from "dotenv";
import { resolve } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { graphRoutes } from "./routes/graph";
import { taskRoutes } from "./routes/tasks";
import { canvasRoutes } from "./routes/canvas";
import { inviteRoutes } from "./routes/invites";
import { userRoutes } from "./routes/users";
import { orgRoutes } from "./routes/orgs";
import { db } from "./db/client";
import { organizations } from "./db/schema";

config({ path: resolve(process.cwd(), ".env.server") });

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

async function buildServer() {
  const app = Fastify({ logger: true });

  const rawAllowed = process.env.APP_URL ?? "http://localhost:3000";
  const allowedOrigins = rawAllowed.split(",").map((s) => s.trim());

  await app.register(cors, {
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  });

  app.get("/health", async () => ({
    status: "ok",
    ok: true,
    service: "flowcanvas-api",
    timestamp: new Date().toISOString(),
  }));

  await app.register(graphRoutes, { prefix: "/api/graph" });
  await app.register(taskRoutes, { prefix: "/api/tasks" });
  await app.register(canvasRoutes, { prefix: "/api/canvas" });
  await app.register(inviteRoutes, { prefix: "/api/invites" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(orgRoutes, { prefix: "/api/orgs" });

  return app;
}

async function bootCheckOrgs() {
  const orgRows = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations);

  if (orgRows.length === 0) {
    console.warn(
      "\n⚠️  [Boot] No orgs in database. Run:  pnpm db:seed\n" +
        "   Then paste the printed ORG_ID into .env.local as NEXT_PUBLIC_ORG_ID\n",
    );
  } else {
    for (const o of orgRows) {
      console.log(`✅ [Boot] Org: "${o.name}" → ${o.id}`);
    }
    console.log(
      `\n👉 If your app shows "Org not found", set in .env.local:\n` +
        `   NEXT_PUBLIC_ORG_ID=${orgRows[0].id}\n`,
    );
  }
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`FlowCanvas API listening on http://${HOST}:${PORT}`);
    await bootCheckOrgs();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
