import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id text`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
    ON users (auth_user_id)
    WHERE auth_user_id IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email text NOT NULL,
      token text NOT NULL UNIQUE,
      role text NOT NULL DEFAULT 'member',
      created_by uuid REFERENCES users(id) ON DELETE SET NULL,
      accepted_at timestamptz,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS invite_tokens_token_idx ON invite_tokens (token)`;
  await sql`CREATE INDEX IF NOT EXISTS invite_tokens_org_idx ON invite_tokens (org_id)`;

  console.log("Phase 8 schema applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
