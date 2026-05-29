import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { users } from "../server/db/schema";

async function linkOwner() {
  const databaseUrl = process.env.DATABASE_URL;
  const orgId = process.env.NEXT_PUBLIC_ORG_ID;
  if (!databaseUrl) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  if (!orgId) {
    console.error("NEXT_PUBLIC_ORG_ID missing — set in .env.local");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { users } });

  const authRows = await sql`
    SELECT id FROM auth_user WHERE email = 'owner@flowcanvas.dev' LIMIT 1
  `;
  if (authRows.length === 0) {
    console.error("Auth user not found. Run pnpm auth:seed first.");
    process.exit(1);
  }

  const authUserId = (authRows[0] as { id: string }).id;

  const preferredEmails = [
    "nadula.nisith@rccs.lk",
    "shasvinth.srikanth@rccs.lk",
  ];

  let domainUser = null as (typeof users.$inferSelect) | undefined;
  for (const email of preferredEmails) {
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.orgId, orgId), eq(users.email, email)))
      .limit(1);
    if (rows[0]) {
      domainUser = rows[0];
      break;
    }
  }

  if (!domainUser) {
    const [fallback] = await db
      .select()
      .from(users)
      .where(eq(users.orgId, orgId))
      .limit(1);
    domainUser = fallback;
  }

  if (!domainUser) {
    console.error("No domain users found. Run pnpm db:seed first.");
    process.exit(1);
  }

  await db
    .update(users)
    .set({ authUserId: null })
    .where(eq(users.authUserId, authUserId));

  await db
    .update(users)
    .set({ authUserId })
    .where(eq(users.id, domainUser.id));

  console.log(
    `Linked auth user ${authUserId} → domain user ${domainUser.id} (${domainUser.name})`,
  );
}

linkOwner().catch((err) => {
  console.error(err);
  process.exit(1);
});
