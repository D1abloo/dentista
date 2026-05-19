import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = '.vercel/output/config.json';
const staticIndex = '.vercel/output/static/index.html';

if (!existsSync(configPath)) {
  console.error(
    'Error: no se generó .vercel/output/config.json. Instala @astrojs/vercel y usa adapter: vercel() en astro.config.mjs.'
  );
  process.exit(1);
}

if (!existsSync(staticIndex)) {
  console.error('Error: falta .vercel/output/static/index.html (página de inicio no prerenderizada).');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const routes = config.routes ?? [];
const hasFilesystem = routes.some((r) => r.handle === 'filesystem');
const hasRootRoute = routes.some((r) => r.src === '^/$' || r.dest === '_render');
const hasApiRoutes = routes.some((r) => typeof r.src === 'string' && r.src.includes('/api/'));

if (!hasFilesystem && !hasRootRoute) {
  console.error('Error: config.json sin handle filesystem ni ruta raíz SSR.');
  process.exit(1);
}

console.log(
  'Vercel Build Output API OK (rutas:',
  routes.length,
  hasFilesystem ? ', static via filesystem' : ', SSR',
  hasApiRoutes ? ', APIs serverless' : '',
  ')'
);
