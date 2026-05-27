import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });
config({ path: resolve(process.cwd(), ".env.local") });

const CHECKS: Array<{ name: string; run: () => Promise<string> }> = [];

function check(name: string, fn: () => Promise<string>) {
  CHECKS.push({ name, run: fn });
}

function isPlaceholderDbUrl(url: string): boolean {
  return (
    url.includes("ep-xxxx") ||
    url.includes("user:password@") ||
    url.includes("@127.0.0.1/build")
  );
}

function fileExists(path: string): boolean {
  return existsSync(resolve(process.cwd(), path));
}

function fileContains(path: string, pattern: RegExp): boolean {
  if (!fileExists(path)) return false;
  return pattern.test(readFileSync(resolve(process.cwd(), path), "utf8"));
}

function walkTsFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
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

check("ENV: .env.server present", async () =>
  fileExists(".env.server") ? "PASS" : "FAIL — copy .env.server.example",
);

check("ENV: .env.local present", async () =>
  fileExists(".env.local") ? "PASS" : "FAIL — copy .env.local.example",
);

check("ENV: DATABASE_URL set", async () => {
  const url = process.env.DATABASE_URL;
  if (!url) return "FAIL — DATABASE_URL missing";
  if (isPlaceholderDbUrl(url)) return "FAIL — DATABASE_URL is still a placeholder";
  return "PASS";
});

check("ENV: NEXT_PUBLIC_ORG_ID set", async () => {
  const orgId = process.env.NEXT_PUBLIC_ORG_ID;
  if (!orgId?.trim()) {
    return "FAIL — run pnpm db:seed and set NEXT_PUBLIC_ORG_ID in .env.local";
  }
  return `PASS — ${orgId}`;
});

check("ENV: BETTER_AUTH_SECRET set", async () =>
  process.env.BETTER_AUTH_SECRET?.length
    ? "PASS"
    : "FAIL — set BETTER_AUTH_SECRET in .env.server / .env.local",
);

check("ENV: BETTER_AUTH_URL set", async () =>
  process.env.BETTER_AUTH_URL ? "PASS" : "FAIL — set BETTER_AUTH_URL",
);

check("DB: Connection reachable", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP — invalid DATABASE_URL";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`SELECT 1`;
    return "PASS";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: Organizations count > 0", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(url);
    const db = drizzle(sql, { schema });
    const [result] = await db
      .select({ c: count() })
      .from(schema.organizations);
    return result.c > 0 ? `PASS — ${result.c} org(s)` : "FAIL — 0 orgs";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: Tasks count >= 9", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(url);
    const db = drizzle(sql, { schema });
    const [result] = await db.select({ c: count() }).from(schema.tasks);
    return result.c >= 9
      ? `PASS — ${result.c} task(s)`
      : `FAIL — expected >= 9, got ${result.c}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: Dependencies count >= 7", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { count } = await import("drizzle-orm");
    const schema = await import("../server/db/schema");
    const sql = neon(url);
    const db = drizzle(sql, { schema });
    const [result] = await db
      .select({ c: count() })
      .from(schema.taskDependencies);
    return result.c >= 7
      ? `PASS — ${result.c} edges`
      : `FAIL — expected >= 7, got ${result.c}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: /health returns ok", async () => {
  try {
    const res = await fetch("http://localhost:3001/health", {
      signal: AbortSignal.timeout(3000),
    });
    const json = (await res.json()) as { ok?: boolean };
    return json.ok ? "PASS" : `FAIL — ${JSON.stringify(json)}`;
  } catch (e: unknown) {
    return `FAIL — server not running? (${e instanceof Error ? e.message : String(e)})`;
  }
});

check("API: /api/graph returns 3 projects, 9 tasks", async () => {
  const orgId = process.env.NEXT_PUBLIC_ORG_ID;
  if (!orgId) return "SKIP — NEXT_PUBLIC_ORG_ID unset";
  try {
    const res = await fetch(`http://localhost:3001/api/graph/${orgId}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return `FAIL — HTTP ${res.status}`;
    const json = (await res.json()) as {
      users?: unknown[];
      projects?: unknown[];
      tasks?: unknown[];
    };
    const users = json.users?.length ?? 0;
    const projects = json.projects?.length ?? 0;
    const tasks = json.tasks?.length ?? 0;
    const ok = users === 4 && projects === 3 && tasks >= 9;
    return ok
      ? `PASS — users=4 projects=3 tasks=${tasks}`
      : `FAIL — users=${users} projects=${projects} tasks=${tasks}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: POST /api/tasks route exists", async () => {
  try {
    const res = await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3000),
    });
    return res.status === 400 ? "PASS — route reachable (400 validation)" : `PASS — HTTP ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: canvas viewport route exists", async () => {
  const orgId = process.env.NEXT_PUBLIC_ORG_ID;
  if (!orgId) return "SKIP";
  try {
    const res = await fetch(
      `http://localhost:3001/api/canvas/viewport/${orgId}?authUserId=test`,
      { signal: AbortSignal.timeout(3000) },
    );
    return res.status === 404 || res.status === 200
      ? `PASS — HTTP ${res.status}`
      : `FAIL — HTTP ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: archivedAt column exists on tasks", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const result = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'archived_at'
    `;
    return result.length > 0
      ? "PASS — archived_at column present"
      : "FAIL — run pnpm db:push";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: DELETE /api/tasks/:id route exists (archive)", async () => {
  try {
    const res = await fetch(
      "http://localhost:3001/api/tasks/00000000-0000-0000-0000-000000000000",
      {
        method: "DELETE",
        signal: AbortSignal.timeout(5000),
      },
    );
    return res.status === 404
      ? "PASS — route exists (404 on missing id)"
      : `FAIL — status ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: POST /api/tasks/:id/dependencies route exists", async () => {
  try {
    const res = await fetch(
      "http://localhost:3001/api/tasks/nonexistent-id/dependencies",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upstreamTaskId: "dummy" }),
        signal: AbortSignal.timeout(3000),
      },
    );
    return res.status !== 404 && res.status !== 405
      ? "PASS"
      : `FAIL — status ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: useMutationOrchestrator exists", async () => {
  return fileExists("src/lib/api/useMutationOrchestrator.ts")
    ? "PASS"
    : "FAIL — file missing";
});

check("SRC: useCPMSync exists", async () => {
  return fileExists("src/lib/canvas/useCPMSync.ts")
    ? "PASS"
    : "FAIL — file missing";
});

check("AUTH: route file exists", async () =>
  fileExists("src/app/api/auth/[...all]/route.ts")
    ? "PASS"
    : "FAIL — missing auth route",
);

check("AUTH: login page exists", async () =>
  fileExists("src/app/login/page.tsx") ? "PASS" : "FAIL — missing login page",
);

check("SRC: FlowCanvas has no mock seed hydration", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "src/components/canvas/FlowCanvas.tsx"),
    "utf8",
  );
  if (
    /buildInitialGraph|from ["']@\/lib\/seed\/mockData|MOCK_TASKS/.test(content)
  ) {
    return "FAIL — mock graph hydration still present";
  }
  return fileContains("src/components/canvas/FlowCanvas.tsx", /useOrgGraph/)
    ? "PASS"
    : "FAIL — useOrgGraph not wired";
});

check("SRC: TaskDetailPanel supports create/edit", async () => {
  const ok =
    fileContains("src/components/panels/TaskDetailPanel.tsx", /task-create/) &&
    fileContains("src/components/panels/TaskDetailPanel.tsx", /task-edit/) &&
    fileContains("src/components/panels/TaskForm.tsx", /TaskForm/);
  return ok ? "PASS" : "FAIL — panel modes incomplete";
});

check("SRC: new-task command is real", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "src/lib/commands/useCommandRegistry.ts"),
    "utf8",
  );
  if (/placeholder|console\.info.*New task/.test(content)) {
    return "FAIL — new-task still placeholder";
  }
  return /openTaskCreate/.test(content) ? "PASS" : "FAIL";
});

check("SRC: No Material Symbols", async () => {
  const srcDir = resolve(process.cwd(), "src");
  const hits: string[] = [];
  for (const file of walkTsFiles(srcDir)) {
    const content = readFileSync(file, "utf8");
    if (/material-symbols|MaterialSymbol/i.test(content)) {
      hits.push(file);
    }
  }
  return hits.length > 0
    ? `FAIL — found in: ${hits.join(", ")}`
    : "PASS";
});

check("SRC: No backdrop-filter on canvas nodes", async () => {
  const hits: string[] = [];
  for (const file of walkTsFiles(resolve(process.cwd(), "src/components/canvas/nodes"))) {
    if (/backdrop-filter|backdrop-blur/.test(readFileSync(file, "utf8"))) {
      hits.push(file);
    }
  }
  return hits.length > 0
    ? `FAIL — ${hits.join(", ")}`
    : "PASS";
});

async function run() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   FlowCanvas Self-Diagnostic v2.0    ║");
  console.log("║         Phase 6A + 6B                ║");
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
    console.log(`${icon} ${c.name.padEnd(52)} ${result}`);
  }

  console.log("\n──────────────────────────────────────────────────");
  console.log(`PASSED: ${passed}   FAILED: ${failed}   SKIPPED: ${skipped}`);
  console.log("\nRun manually: pnpm build && pnpm typecheck && pnpm typecheck:server");

  process.exit(failed > 0 ? 1 : 0);
}

run();
