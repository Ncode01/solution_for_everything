import { sql } from "drizzle-orm";
import { db } from "./client";

async function resetDatabase() {
  console.log("[reset] Wiping all data from database...");

  try {
    await db.execute(sql`SET session_replication_role = replica`);
  } catch {
    console.warn(
      "[reset] session_replication_role=replica not permitted — continuing with TRUNCATE CASCADE",
    );
  }

  await db.execute(sql`
    TRUNCATE TABLE
      task_dependencies,
      task_assignments,
      comments,
      canvas_bookmarks,
      canvas_positions,
      tasks,
      phases,
      cross_project_links,
      budget_entries,
      milestones,
      org_roles,
      project_orgs,
      projects,
      invite_tokens,
      users,
      organizations
    RESTART IDENTITY CASCADE
  `);

  try {
    await db.execute(sql`SET session_replication_role = DEFAULT`);
  } catch {
    // Neon pooled roles cannot set session_replication_role
  }

  console.log("[reset] Done. Database is clean.");
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("[reset] Failed:", err);
  process.exit(1);
});
