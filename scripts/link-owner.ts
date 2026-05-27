import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { users } from "../server/db/schema";

async function linkOwner() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL missing");
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

  let domainRows = await db
    .select()
    .from(users)
    .where(eq(users.email, "owner@flowcanvas.dev"))
    .limit(1);

  if (domainRows.length === 0) {
    domainRows = await db
      .select()
      .from(users)
      .where(eq(users.email, "sarah@flowcanvas.dev"))
      .limit(1);
  }

  const domainUser =
    domainRows[0] ?? (await db.select().from(users).limit(1))[0];

  if (!domainUser) {
    console.error("No domain users found. Run pnpm db:seed first.");
    process.exit(1);
  }

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
