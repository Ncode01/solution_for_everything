import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./schema";

/** Build-safe placeholder — runtime routes require a real DATABASE_URL in .env.local */
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable";

const sql = neon(connectionString);
export const authDb = drizzle(sql, { schema: authSchema });
export { authSchema };
