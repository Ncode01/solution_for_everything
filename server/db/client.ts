import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[db] DATABASE_URL is not set — configure .env.server before starting the API",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export type DB = typeof db;

export { schema };
