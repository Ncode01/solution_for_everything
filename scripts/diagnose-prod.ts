/**
 * Production smoke checks — no local .env.server required.
 * Usage:
 *   PROD_API_URL=https://api.example.com NEXT_PUBLIC_ORG_ID=<uuid> pnpm diagnose:prod
 */

const API_URL = process.env.PROD_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

interface CheckResult {
  name: string;
  result: string;
  pass: boolean;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<string>) {
  try {
    const result = await fn();
    const pass =
      result.startsWith("PASS") ||
      result.startsWith("SKIP") ||
      result.startsWith("WARN");
    results.push({ name, result, pass });
    console.log(`${pass ? "✅" : "❌"} ${name.padEnd(55)} ${result}`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ name, result: `ERROR — ${message}`, pass: false });
    console.log(`❌ ${name.padEnd(55)} ERROR — ${message}`);
  }
}

async function run() {
  console.log("\n╔══════════════════════════════════╗");
  console.log("║  FlowCanvas Production Diagnostic ║");
  console.log("╚══════════════════════════════════╝\n");

  await check("ENV: PROD_API_URL set", async () =>
    API_URL ? `PASS — ${API_URL}` : "FAIL — PROD_API_URL not set",
  );

  await check("ENV: ORG_ID set", async () =>
    ORG_ID ? `PASS — ${ORG_ID}` : "FAIL — NEXT_PUBLIC_ORG_ID not set",
  );

  await check("API: /api/orgs/first returns org", async () => {
    const res = await fetch(`${API_URL}/api/orgs/first`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      return "FAIL — no org in DB (run ALLOW_PROD_SEED=true pnpm db:seed)";
    }
    if (!res.ok) return `FAIL — HTTP ${res.status}`;
    const json = (await res.json()) as {
      id?: string;
      name?: string;
      slug?: string;
    };
    return json.id && json.slug === "rccs-2026"
      ? `PASS — ${json.name} (${json.id})`
      : `FAIL — ${JSON.stringify(json)}`;
  });

  await check("API: /health returns ok", async () => {
    const res = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { status?: string; ok?: boolean };
    return json.status === "ok" || json.ok === true
      ? "PASS"
      : `FAIL — ${JSON.stringify(json)}`;
  });

  await check("API: /api/graph returns real data", async () => {
    if (!ORG_ID) return "SKIP — no ORG_ID";
    const res = await fetch(`${API_URL}/api/graph/${ORG_ID}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return `FAIL — HTTP ${res.status}`;
    const json = (await res.json()) as {
      tasks?: unknown[];
      projects?: unknown[];
      users?: unknown[];
    };
    const t = json.tasks?.length ?? 0;
    const p = json.projects?.length ?? 0;
    return t >= 17 && p >= 7
      ? `PASS — users=${json.users?.length} projects=${p} tasks=${t}`
      : `FAIL — tasks=${t} projects=${p} (expected >=17 tasks, >=7 projects)`;
  });

  await check("API: GET /api/invites/:token route exists (404 on fake)", async () => {
    const res = await fetch(`${API_URL}/api/invites/fake-token`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 404 ? "PASS" : `FAIL — got ${res.status}`;
  });

  await check("API: Mutating routes protected (POST /api/tasks → 401)", async () => {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "test" }),
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 401
      ? "PASS — 401 on unauthenticated request"
      : `FAIL — got ${res.status}`;
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\nPASSED: ${passed}   FAILED: ${failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
