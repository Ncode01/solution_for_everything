import { config } from "dotenv";
import { resolve } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

const CHECKS: Array<{ name: string; run: () => Promise<string> }> = [];

function check(name: string, fn: () => Promise<string>) {
  CHECKS.push({ name, run: fn });
}

check("ENV: DATABASE_URL set", async () => {
  return process.env.DATABASE_URL
    ? "PASS"
    : "FAIL — DATABASE_URL missing in .env.server";
});

check("DB: Connection reachable", async () => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    await sql`SELECT 1`;
    return "PASS";
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `FAIL — ${message}`;
  }
});

check("DB: Organizations table has rows", async () => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });
    const [result] = await db
      .select({ c: count() })
      .from(schema.organizations);
    return result.c > 0 ? `PASS — ${result.c} org(s)` : "FAIL — 0 orgs";
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `FAIL — ${message}`;
  }
});

check("DB: Tasks table has rows", async () => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });
    const [result] = await db.select({ c: count() }).from(schema.tasks);
    return result.c > 0 ? `PASS — ${result.c} task(s)` : "FAIL — 0 tasks";
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `FAIL — ${message}`;
  }
});

check("DB: Dependencies seeded", async () => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });
    const [result] = await db
      .select({ c: count() })
      .from(schema.taskDependencies);
    return result.c > 0
      ? `PASS — ${result.c} dependency edges`
      : "FAIL — 0 dependencies";
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `FAIL — ${message}`;
  }
});

check("API: Fastify health check", async () => {
  try {
    const res = await fetch("http://localhost:3001/health", {
      signal: AbortSignal.timeout(3000),
    });
    const json = (await res.json()) as { ok?: boolean };
    return json.ok ? "PASS" : `FAIL — unexpected response: ${JSON.stringify(json)}`;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `FAIL — server not running? (${message})`;
  }
});

function walkTsFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") {
        walkTsFiles(full, files);
      }
    } else if (/\.(tsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

check("SRC: No Material Symbols icons", async () => {
  const srcDir = resolve(process.cwd(), "src");
  const hits: string[] = [];
  for (const file of walkTsFiles(srcDir)) {
    const content = readFileSync(file, "utf8");
    if (/material-symbols|MaterialSymbol/i.test(content)) {
      hits.push(file);
    }
  }
  return hits.length > 0
    ? `FAIL — Material Symbols found in: ${hits.join(", ")}`
    : "PASS";
});

async function run() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   FlowCanvas Self-Diagnostic v1.0    ║");
  console.log("╚══════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const c of CHECKS) {
    const result = await c.run();
    const icon = result.startsWith("PASS")
      ? "✅"
      : result.startsWith("SKIP")
        ? "⏭ "
        : "❌";
    if (result.startsWith("PASS")) passed++;
    else if (result.startsWith("SKIP")) skipped++;
    else failed++;
    console.log(`${icon} ${c.name.padEnd(50)} ${result}`);
  }

  console.log("\n──────────────────────────────────────────────────");
  console.log(`PASSED: ${passed}   FAILED: ${failed}   SKIPPED: ${skipped}`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
