#!/usr/bin/env node
/**
 * Aplica un archivo SQL de migración usando DATABASE_URL del .env
 * Uso: node --env-file=.env scripts/apply-sql-migration.mjs supabase/migrations/0013_clinical_reports_rls.sql
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
const url = process.env.DATABASE_URL;
if (!file || !url) {
  console.error('Uso: node --env-file=.env scripts/apply-sql-migration.mjs <ruta.sql>');
  process.exit(1);
}

const sql = readFileSync(resolve(file), 'utf8');

const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log(`OK: ${file}`);
} finally {
  await client.end();
}
