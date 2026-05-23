import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = 'http://127.0.0.1:4321';
const outDir = path.resolve('docs/screenshots/landing');

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(base);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Dev server not ready');
}

async function main() {
  await waitForServer();
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const banner = document.querySelector('.lp-cookie');
    if (banner instanceof HTMLElement) banner.style.display = 'none';
  });
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(outDir, '01-hero-header.png') });

  await page.evaluate(() => window.scrollTo(0, 720));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '02-quien-eres-funciones.png') });

  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '03-planes-seguridad.png') });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '04-cta-footer.png') });

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.locator('.df-lp-enter-dd__trigger').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '05-dropdown-entrar.png') });

  await page.setViewportSize({ width: 1440, height: 4200 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '00-full-page.png'), fullPage: true });

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);

  const panelDir = path.resolve('docs/screenshots/panels');
  await mkdir(panelDir, { recursive: true });
  const panelBrowser = await chromium.launch();
  const panelPage = await panelBrowser.newPage({ viewport: { width: 1280, height: 800 } });

  const panelRoutes = [
    { name: 'admin-agenda', url: `${base}/admin/agenda` },
    { name: 'paciente-inicio', url: `${base}/paciente` },
    { name: 'platform-login', url: `${base}/platform/login` }
  ];

  for (const route of panelRoutes) {
    await panelPage.goto(route.url, { waitUntil: 'networkidle' });
    await panelPage.waitForTimeout(600);
    await panelPage.screenshot({ path: path.join(panelDir, `${route.name}.png`) });
  }

  await panelBrowser.close();
  console.log(`Panel screenshots saved to ${panelDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
