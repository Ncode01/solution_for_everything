import { config } from "dotenv";
import { resolve } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { graphRoutes } from "./routes/graph";

config({ path: resolve(process.cwd(), ".env.server") });

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.get("/health", async () => ({
    ok: true,
    service: "flowcanvas-api",
    timestamp: new Date().toISOString(),
  }));

  await app.register(graphRoutes, { prefix: "/api/graph" });

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
