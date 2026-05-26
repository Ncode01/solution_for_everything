import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set — API graph routes will return errors until .env.server is configured",
  );
}

const sql = neon(connectionString ?? "postgresql://invalid/local");

export const db = drizzle(sql, { schema });

export type DB = typeof db;

export { schema };
