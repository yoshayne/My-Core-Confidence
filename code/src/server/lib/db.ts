import { Pool } from "pg";

// Railway's INTERNAL DB URL usually needs NO SSL; the EXTERNAL proxy URL does.
const useSsl =
  /sslmode=require/.test(process.env.DATABASE_URL ?? "") ||
  process.env.DATABASE_SSL === "true";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
