#!/usr/bin/env node
/**
 * Ayuda a sincronizar .env → Vercel CLI.
 * No imprime valores en --check. Con --push usa `vercel env add`.
 *
 * Uso:
 *   node scripts/vercel-env-from-dotenv.mjs --check
 *   node scripts/vercel-env-from-dotenv.mjs --push production
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SENSITIVE = new Set([
  'AUTH_SESSION_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_PANEL_ENTRY_SECRET',
  'SUPER_ADMIN_PASSWORD',
  'CLINIC_DEFAULT_PASSWORD',
  'SMTP_PASS',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'DATABASE_URL'
]);

const SKIP = new Set([
  'GITHUB_REMOTE_URL',
  'GIT_BRANCH',
  'GIT_AUTHOR_NAME',
  'GIT_AUTHOR_EMAIL'
]);

function parseEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const args = process.argv.slice(2);
const push = args.includes('--push');
const target = args.find((a) => ['production', 'preview', 'development'].includes(a)) ?? 'production';
const env = parseEnv('.env');

if (!Object.keys(env).length) {
  console.error('No se encontró .env en la raíz del proyecto.');
  process.exit(1);
}

const keys = Object.keys(env).filter((k) => !SKIP.has(k)).sort();

if (!push) {
  console.log('Claves en .env listas para Vercel:\n');
  for (const k of keys) {
    const empty = !env[k];
    const sens = SENSITIVE.has(k) ? ' [Sensitive]' : '';
    console.log(`  ${empty ? '⚠ vacía ' : '✓       '}${k}${sens}`);
  }
  console.log(`\nTotal: ${keys.length}. Ver docs/VERCEL_ENV.md`);
  console.log('Para subir: node scripts/vercel-env-from-dotenv.mjs --push production');
  process.exit(0);
}

const vercel = spawnSync('vercel', ['--version'], { encoding: 'utf8' });
if (vercel.status !== 0) {
  console.error('Instala Vercel CLI: npm i -g vercel && vercel link');
  process.exit(1);
}

console.log(`Subiendo ${keys.length} variables a entorno "${target}"...\n`);

for (const k of keys) {
  const v = env[k];
  if (!v) {
    console.log(`⊘ ${k} (vacía, omitida)`);
    continue;
  }
  const r = spawnSync('vercel', ['env', 'add', k, target, '--force'], {
    input: v,
    encoding: 'utf8'
  });
  if (r.status === 0) console.log(`✓ ${k}`);
  else console.error(`✗ ${k}:`, r.stderr?.trim() || r.stdout?.trim());
}

console.log('\nHecho. Marca Sensitive en el dashboard las claves indicadas en docs/VERCEL_ENV.md');
