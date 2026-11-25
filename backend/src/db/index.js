import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

/**
 * Database access layer.
 *
 * Production: PostgreSQL via `pg` (set DATABASE_URL).
 * Development without a Postgres server: embedded PGlite (real Postgres compiled to WASM),
 * persisted under backend/.data/. Same SQL and the same $1-style parameters in both cases.
 */
let driver;

async function init() {
  if (driver) return driver;
  if (config.databaseUrl) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 10,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    driver = {
      kind: 'postgres',
      query: (text, params) => pool.query(text, params),
      exec: (text) => pool.query(text),
      close: () => pool.end(),
    };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    fs.mkdirSync(config.pgliteDir, { recursive: true });
    const db = await PGlite.create(config.pgliteDir);
    driver = {
      kind: 'pglite',
      query: (text, params) => db.query(text, params),
      exec: (text) => db.exec(text),
      close: () => db.close(),
    };
  }
  return driver;
}

export async function query(text, params = []) {
  const d = await init();
  return d.query(text, params);
}

export async function one(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0] ?? null;
}

export async function many(text, params = []) {
  const { rows } = await query(text, params);
  return rows;
}

export async function migrate() {
  const d = await init();
  const sql = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'), 'utf8');
  await d.exec(sql);
  return d.kind;
}

export async function close() {
  if (driver) await driver.close();
  driver = undefined;
}
