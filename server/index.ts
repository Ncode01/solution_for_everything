import { config } from "dotenv";
import { resolve } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { graphRoutes } from "./routes/graph";
import { taskRoutes } from "./routes/tasks";
import { canvasRoutes } from "./routes/canvas";
import { inviteRoutes } from "./routes/invites";
import { userRoutes } from "./routes/users";

config({ path: resolve(process.cwd(), ".env.server") });

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = process.env.APP_URL ?? "http://localhost:3000";
      if (
        !origin ||
        origin === allowed ||
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
    ok: true,
    service: "flowcanvas-api",
    timestamp: new Date().toISOString(),
  }));

  await app.register(graphRoutes, { prefix: "/api/graph" });
  await app.register(taskRoutes, { prefix: "/api/tasks" });
  await app.register(canvasRoutes, { prefix: "/api/canvas" });
  await app.register(inviteRoutes, { prefix: "/api/invites" });
  await app.register(userRoutes, { prefix: "/api/users" });

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`FlowCanvas API listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
