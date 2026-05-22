#!/usr/bin/env node
/**
 * Genera capturas PNG originales del UI (viewport móvil) para el centro de ayuda.
 * Requiere: servidor en http://127.0.0.1:4321 (npm run dev)
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.GUIDE_CAPTURE_BASE ?? 'http://127.0.0.1:4321';
const OUT_DIR = join(ROOT, 'public/images/guides/mobile');
const LANDING_OUT_DIR = join(ROOT, 'public/images/guides/landing');

const SCENES = [
  'pdp-inicio',
  'pdp-citas',
  'pdp-informes',
  'pdp-documentos',
  'pdp-facturas',
  'pdp-pagos',
  'pdp-consentimientos',
  'admin-dashboard',
  'admin-agenda',
  'admin-pacientes',
  'admin-facturas',
  'admin-acceso'
];

async function runBuild() {
  const { execSync } = await import('node:child_process');
  console.log('Compilando para capturas sin overlay de desarrollo…');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return true;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(LANDING_OUT_DIR, { recursive: true });

  let serverProc;
  const needServer = !(await waitForServer(BASE));
  if (needServer) {
    await runBuild();
    serverProc = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4321'], {
      cwd: ROOT,
      stdio: 'ignore',
      detached: false
    });
    const ok = await waitForServer(BASE, 80);
    if (!ok) {
      serverProc?.kill();
      throw new Error('No se pudo iniciar dev en :4321');
    }
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 360, height: 720 },
    deviceScaleFactor: 2
  });

  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE:', msg.text());
  });

  await page.addInitScript(() => {
    localStorage.setItem('dentista_patient_id', 'PAT-0001');
    localStorage.setItem('dentista_tenant_id', 'TEN-0001');
  });

  for (const scene of SCENES) {
    const url = `${BASE}/internal/guia-capturas?scene=${scene}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.guide-phone-frame', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('.guide-shot-body', { state: 'attached', timeout: 45000 });
    await page.waitForTimeout(2000);
    const frame = page.locator('.guide-phone-frame');
    await page.locator('.astro-error-overlay').count().then((n) => {
      if (n > 0) throw new Error(`Overlay de error visible en escena ${scene}`);
    });
    const outPath = join(OUT_DIR, `${scene}.png`);
    await frame.screenshot({ path: outPath, type: 'png' });
    console.log(`OK ${scene}.png`);
  }

  const deskPage = await browser.newPage({
    viewport: { width: 960, height: 560 },
    deviceScaleFactor: 2
  });
  deskPage.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));
  await deskPage.addInitScript(() => {
    localStorage.setItem('dentista_patient_id', 'PAT-0001');
    localStorage.setItem('dentista_tenant_id', 'TEN-0001');
  });
  const deskUrl = `${BASE}/internal/guia-capturas?scene=admin-dashboard&layout=desktop`;
  await deskPage.goto(deskUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await deskPage.waitForSelector('.guide-shot-body', { state: 'attached', timeout: 45000 });
  await deskPage.waitForTimeout(2000);
  const heroPath = join(LANDING_OUT_DIR, 'admin-dashboard-hero.png');
  await deskPage.locator('.guide-desktop-frame').screenshot({ path: heroPath, type: 'png' });
  console.log('OK landing/admin-dashboard-hero.png');

  await browser.close();
  if (serverProc) serverProc.kill('SIGTERM');
  console.log('Capturas guardadas en public/images/guides/mobile/ y landing/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
