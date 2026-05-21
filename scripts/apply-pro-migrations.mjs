import dns from 'node:dns';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

dns.setDefaultResultOrder('ipv4first');

const START_FROM = process.env.START_FROM;
const PRO_MIGRATIONS = [
  '0001_schema.sql',
  '0003_operations.sql',
  '0006_multi_tenant_rls.sql',
  '0008_production_platform.sql',
  '0009_auth_bootstrap.sql',
  '0010_phase3_records_billing.sql',
  '0011_phase4_ops.sql',
  '0012_organization_branches.sql',
  '0013_patient_portal_access.sql',
  '0014_profile_password_policy.sql'
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const poolerHosts = [
  process.env.POOLER_HOST,
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com'
].filter(Boolean);

async function connectClient() {
  const direct = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await direct.connect();
    return direct;
  } catch (err) {
    await direct.end().catch(() => undefined);
    if (!String(err.code).includes('ENETUNREACH') && !String(err.message).includes('ENETUNREACH')) throw err;
  }

  const parsed = new URL(url);
  const password = encodeURIComponent(parsed.password);
  const db = parsed.pathname.replace(/^\//, '') || 'postgres';
  const projectRef = parsed.hostname.replace(/^db\./, '').split('.')[0] || process.env.SUPABASE_PROJECT_REF;
  const regions = [
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'us-east-1',
    'us-west-1',
    'ap-southeast-1'
  ];
  const errors = [];

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const port of ['6543', '5432']) {
      for (const user of [`postgres.${projectRef}`, 'postgres']) {
        const poolerUrl = `postgresql://${user}:${password}@${host}:${port}/${db}`;
        const c = new pg.Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });
        try {
          await c.connect();
          console.log(`Conectado vía pooler ${host}:${port} (${user})`);
          return c;
        } catch (err) {
          errors.push(`${host}:${port} ${user} → ${err.message}`);
          await c.end().catch(() => undefined);
        }
      }
    }
  }
  console.error('Intentos fallidos:\n', errors.slice(-8).join('\n'));
  throw new Error('No se pudo conectar (directo ni pooler). Usa SQL Editor en Supabase.');
}

let client;

async function runFile(name) {
  const path = join(process.cwd(), 'supabase/migrations', name);
  const sql = readFileSync(path, 'utf8');
  console.log(`\n▶ ${name} ...`);
  await client.query(sql);
  console.log(`✓ ${name}`);
}

async function main() {
  client = await connectClient();
  const tables = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`
  );
  console.log(`Tablas actuales (${tables.rows.length}):`, tables.rows.map((r) => r.tablename).join(', ') || '(ninguna)');

  const queue = START_FROM ? PRO_MIGRATIONS.slice(PRO_MIGRATIONS.indexOf(START_FROM)) : PRO_MIGRATIONS;
  for (const file of queue) {
    try {
      await runFile(file);
    } catch (err) {
      console.error(`✗ ${file}:`, err.message);
      process.exit(1);
    }
  }

  const after = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`
  );
  console.log(`\nListo. Tablas (${after.rows.length}):`);
  for (const row of after.rows) console.log(`  - ${row.tablename}`);
  await client.end().catch(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
