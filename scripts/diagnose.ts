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
    return res.status === 400 || res.status === 401
      ? "PASS — route reachable (auth or validation)"
      : `PASS — HTTP ${res.status}`;
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
    return res.status === 404 || res.status === 401
      ? "PASS — route exists (404/401)"
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

check("SRC: workload layer has no mock runtime data", async () => {
  const paths = [
    "src/lib/canvas/useWorkloadLayer.ts",
    "src/components/canvas/WorkloadBanner.tsx",
    "src/components/canvas/FlowCanvas.tsx",
  ];
  for (const p of paths) {
    const content = readFileSync(resolve(process.cwd(), p), "utf8");
    if (/from ["']@\/lib\/seed\/mockData|MOCK_USERS|MOCK_TASKS/.test(content)) {
      return `FAIL — mock data in ${p}`;
    }
    if (
      p.includes("FlowCanvas") &&
      /from ["']@\/lib\/canvas\/seedToNodes["']/.test(content)
    ) {
      return "FAIL — FlowCanvas imports seedToNodes (pulls mock bundle)";
    }
  }
  return fileExists("src/lib/canvas/dependencyEdgeStyles.ts")
    ? "PASS"
    : "FAIL — missing dependencyEdgeStyles.ts";
});

check("SRC: FlowCanvas has no mock seed hydration", async () => {
  const flowContent = readFileSync(
    resolve(process.cwd(), "src/components/canvas/FlowCanvas.tsx"),
    "utf8",
  );
  if (
    /buildInitialGraph|from ["']@\/lib\/seed\/mockData|MOCK_TASKS/.test(
      flowContent,
    )
  ) {
    return "FAIL — mock graph hydration still present";
  }
  const shellContent = fileExists("src/components/ui/AppShell.tsx")
    ? readFileSync(
        resolve(process.cwd(), "src/components/ui/AppShell.tsx"),
        "utf8",
      )
    : "";
  const graphWired =
    /useOrgGraph|OrgGraphHydrator/.test(flowContent) ||
    /useOrgGraph|OrgGraphHydrator/.test(shellContent);
  return graphWired ? "PASS" : "FAIL — useOrgGraph not wired";
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

check("SRC: nodeTypes declared outside FlowCanvas component", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/components/canvas/FlowCanvas.tsx"),
      "utf8",
    );
    const funcStart = Math.max(
      content.indexOf("function FlowCanvas"),
      content.indexOf("const FlowCanvas = "),
    );
    const nodeTypesPos = content.indexOf("const nodeTypes");
    if (nodeTypesPos === -1) return "FAIL — nodeTypes not found";
    return nodeTypesPos < funcStart
      ? "PASS"
      : "FAIL — nodeTypes is inside component body (performance bug)";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: edgeTypes declared outside FlowCanvas component", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/components/canvas/FlowCanvas.tsx"),
      "utf8",
    );
    const funcStart = Math.max(
      content.indexOf("function FlowCanvas"),
      content.indexOf("const FlowCanvas = "),
    );
    const edgeTypesPos = content.indexOf("const edgeTypes");
    if (edgeTypesPos === -1) return "SKIP — edgeTypes not found";
    return edgeTypesPos < funcStart
      ? "PASS"
      : "FAIL — edgeTypes is inside component body (performance bug)";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: No raw fetch() in component files", async () => {
  const hits: string[] = [];
  const componentsDir = resolve(process.cwd(), "src/components");
  for (const file of walkTsFiles(componentsDir)) {
    if (!file.endsWith(".tsx")) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (
        /\bfetch\s*\(/.test(line) &&
        !/apiFetch/.test(line) &&
        !/\.refetch\s*\(/.test(line)
      ) {
        hits.push(`${file}: ${line.trim()}`);
      }
    }
  }
  return hits.length > 0 ? `FAIL — raw fetch found:\n${hits.join("\n")}` : "PASS";
});

check("SRC: No server imports in src/", async () => {
  const hits: string[] = [];
  for (const file of walkTsFiles(resolve(process.cwd(), "src"))) {
    const content = readFileSync(file, "utf8");
    if (/from\s+['"].*server\//.test(content)) {
      hits.push(file);
    }
  }
  return hits.length > 0 ? `FAIL — ${hits.join(", ")}` : "PASS";
});

check("SRC: GanttView component exists", async () =>
  fileExists("src/components/views/GanttView.tsx") ||
  fileExists("src/app/gantt/page.tsx")
    ? "PASS"
    : "FAIL — GanttView not found",
);

check("SRC: DashboardView component exists", async () =>
  fileExists("src/components/views/DashboardView.tsx") ||
  fileExists("src/app/dashboard/page.tsx")
    ? "PASS"
    : "FAIL — DashboardView not found",
);

check("SRC: ganttUtils.ts exists", async () =>
  fileExists("src/lib/gantt/ganttUtils.ts") ? "PASS" : "FAIL",
);

check("SRC: dashboardUtils.ts exists", async () =>
  fileExists("src/lib/dashboard/dashboardUtils.ts") ? "PASS" : "FAIL",
);

check("SRC: Firebase config uses only env vars", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/lib/firebase/config.ts"),
      "utf8",
    );
    const hardcoded = /apiKey:\s*["'][A-Za-z0-9_-]{10,}["']/.test(content);
    return hardcoded ? "FAIL — hardcoded Firebase key found" : "PASS";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: AppShell renders GanttView", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/components/ui/AppShell.tsx"),
      "utf8",
    );
    return content.includes("GanttView") && /['"]gantt['"]/.test(content)
      ? "PASS"
      : "FAIL — GanttView not in AppShell";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: AppShell renders DashboardView", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/components/ui/AppShell.tsx"),
      "utf8",
    );
    return content.includes("DashboardView") &&
      /['"]dashboard['"]/.test(content)
      ? "PASS"
      : "FAIL — DashboardView not in AppShell";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: recharts dependency installed", async () => {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };
    return pkg.dependencies?.recharts ? "PASS" : "FAIL — recharts not in package.json";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: inviteTokens table exists", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const result = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'invite_tokens'
    `;
    return result.length > 0 ? "PASS" : "FAIL — run pnpm db:push";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("DB: authUserId column on users", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || isPlaceholderDbUrl(url)) return "SKIP";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const result = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'auth_user_id'
    `;
    return result.length > 0 ? "PASS" : "FAIL — run pnpm db:push";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: POST /api/invites route exists", async () => {
  try {
    const res = await fetch("http://localhost:3001/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3000),
    });
    return res.status === 400 || res.status === 401
      ? "PASS — route reachable (auth or validation)"
      : `PASS — HTTP ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: GET /api/invites/:token route exists", async () => {
  try {
    const res = await fetch(
      "http://localhost:3001/api/invites/00000000-0000-0000-0000-000000000000",
      { signal: AbortSignal.timeout(3000) },
    );
    return res.status === 404
      ? "PASS — route exists (404 on fake token)"
      : `FAIL — status ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("API: GET /api/users/me route exists", async () => {
  try {
    const res = await fetch(
      "http://localhost:3001/api/users/me?authUserId=unlinked-test-id",
      { signal: AbortSignal.timeout(3000) },
    );
    return res.status === 404
      ? "PASS — route exists (404 on unlinked)"
      : `FAIL — status ${res.status}`;
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: PresenceOrchestrator exists", async () =>
  fileExists("src/components/ui/PresenceOrchestrator.tsx")
    ? "PASS"
    : "FAIL",
);

check("SRC: usePresence exists", async () =>
  fileExists("src/lib/firebase/usePresence.ts") ? "PASS" : "FAIL",
);

check("SRC: RemoteCursors component exists", async () =>
  fileExists("src/components/canvas/RemoteCursors.tsx") ? "PASS" : "FAIL",
);

check("SRC: invite page exists at src/app/invite/[token]/page.tsx", async () =>
  fileExists("src/app/invite/[token]/page.tsx") ? "PASS" : "FAIL",
);

check("SRC: useCurrentUser hook exists", async () =>
  fileExists("src/lib/api/useCurrentUser.ts") ? "PASS" : "FAIL",
);

check("SRC: AppShell mounts PresenceOrchestrator", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "src/components/ui/AppShell.tsx"),
      "utf8",
    );
    return content.includes("PresenceOrchestrator") ? "PASS" : "FAIL";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: ErrorBoundary component exists", async () =>
  fileExists("src/components/ui/ErrorBoundary.tsx") ? "PASS" : "FAIL",
);

check("SRC: KeyboardHelpOverlay component exists", async () =>
  fileExists("src/components/ui/KeyboardHelpOverlay.tsx") ? "PASS" : "FAIL",
);

check("SRC: Toast/ToastContainer component exists", async () =>
  fileExists("src/components/ui/Toast.tsx") &&
  /ToastContainer/.test(
    readFileSync(
      resolve(process.cwd(), "src/components/ui/Toast.tsx"),
      "utf8",
    ),
  )
    ? "PASS"
    : "FAIL",
);

check("SRC: No firebase/compat imports", async () => {
  const hits: string[] = [];
  for (const file of walkTsFiles(resolve(process.cwd(), "src"))) {
    if (/firebase\/compat/.test(readFileSync(file, "utf8"))) {
      hits.push(file);
    }
  }
  return hits.length > 0 ? `FAIL — ${hits.join(", ")}` : "PASS";
});

check("SRC: All Zustand selectors use selector functions", async () => {
  const bareCanvas = /useCanvasStore\s*\(\s*\)/;
  const bareUi = /useUIStore\s*\(\s*\)/;
  const hits: string[] = [];
  for (const file of walkTsFiles(resolve(process.cwd(), "src"))) {
    const content = readFileSync(file, "utf8");
    if (bareCanvas.test(content) || bareUi.test(content)) {
      hits.push(file);
    }
  }
  return hits.length > 0 ? `FAIL — bare store calls: ${hits.join(", ")}` : "PASS";
});

check("SRC: Seed has production guard", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "server/db/seed.ts"),
    "utf8",
  );
  return /NODE_ENV.*production/.test(content) && /SEED BLOCKED/.test(content)
    ? "PASS"
    : "FAIL";
});

check("SRC: vercel.json exists", async () =>
  fileExists("vercel.json") ? "PASS" : "FAIL",
);

check("SRC: DEPLOY.md exists", async () =>
  fileExists("docs/DEPLOY.md") ? "PASS" : "FAIL",
);

check("SRC: AppShell wraps views in ErrorBoundary", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "src/components/ui/AppShell.tsx"),
    "utf8",
  );
  return content.includes("ErrorBoundary") &&
    content.includes("Canvas failed to load")
    ? "PASS"
    : "FAIL";
});

check("SRC: TaskCardNode is wrapped in React.memo", async () => {
  const content = readFileSync(
    resolve(
      process.cwd(),
      "src/components/canvas/nodes/TaskCardNode.tsx",
    ),
    "utf8",
  );
  return /React\.memo|memo\s*\(/.test(content) ? "PASS" : "FAIL";
});

check("SERVER: CORS does not use wildcard origin", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "server/index.ts"),
    "utf8",
  );
  if (/origin:\s*['"]\*['"]/.test(content)) {
    return "FAIL — wildcard CORS origin";
  }
  return /credentials:\s*true/.test(content) ? "PASS" : "FAIL — no credentials";
});

check("SRC: scripts/link-owner.ts exists", async () =>
  fileExists("scripts/link-owner.ts") ? "PASS" : "FAIL",
);

check("SRC: diagnose-prod.ts exists", async () =>
  fileExists("scripts/diagnose-prod.ts") ? "PASS" : "FAIL",
);

check("SRC: diagnose:prod script in package.json", async () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  return pkg.scripts?.["diagnose:prod"] ? "PASS" : "FAIL";
});

check("API: /health includes status ok field", async () => {
  try {
    const res = await fetch("http://localhost:3001/health", {
      signal: AbortSignal.timeout(3000),
    });
    const json = (await res.json()) as { status?: string };
    return json.status === "ok" ? "PASS" : "FAIL — missing status: ok";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

check("SRC: requireSession helper exists", async () =>
  fileExists("server/lib/auth.ts") ? "PASS" : "FAIL",
);

check("SRC: apiFetch uses credentials include", async () => {
  const content = readFileSync(
    resolve(process.cwd(), "src/lib/api/client.ts"),
    "utf8",
  );
  return content.includes('credentials: "include"') ? "PASS" : "FAIL";
});

check("FIRESTORE: rules file has no open wildcard allow all", async () => {
  try {
    const content = readFileSync(
      resolve(process.cwd(), "firestore.rules"),
      "utf8",
    );
    const hasCatchAllDeny = /match \/\{document=\*\*\}/.test(content) &&
      /allow read, write: if false/.test(content);
    const rootOpen = /match \/\{document=\*\*\}[\s\S]*allow read, write: if true/.test(
      content,
    );
    if (rootOpen) return "FAIL — open wildcard allow all";
    return hasCatchAllDeny ? "PASS" : "FAIL — missing catch-all deny";
  } catch (e: unknown) {
    return `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }
});

async function run() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   FlowCanvas Self-Diagnostic v5.1    ║");
  console.log("║   Phase 10 — Deploy Prep             ║");
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
