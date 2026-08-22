import { neon } from '@neondatabase/serverless';

let sql = null;
let schemaReady = false;

export function hasDatabase() {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL);
}

export function getSql() {
  if (!hasDatabase()) return null;
  if (!sql) {
    const url =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;
    sql = neon(url);
  }
  return sql;
}

export async function ensureSchema() {
  const db = getSql();
  if (!db || schemaReady) return db;
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      password TEXT,
      plan TEXT DEFAULT 'free',
      credits INTEGER DEFAULT 0,
      reset_token TEXT,
      reset_expires BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT UNIQUE,
      excerpt TEXT,
      content TEXT,
      author TEXT,
      published BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  schemaReady = true;
  return db;
}

export async function kvGet(key, fallback = null) {
  const db = await ensureSchema();
  if (!db) return fallback;
  const rows = await db`SELECT value FROM kv WHERE key = ${key} LIMIT 1`;
  if (!rows.length) return fallback;
  return rows[0].value;
}

export async function kvSet(key, value) {
  const db = await ensureSchema();
  if (!db) return false;
  const json = JSON.stringify(value);
  await db`
    INSERT INTO kv (key, value, updated_at)
    VALUES (${key}, ${json}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${json}::jsonb, updated_at = NOW()
  `;
  return true;
}
