/**
 * Si en Vercel "Output Directory" quedó en `dist`, copiamos el HTML prerenderizado
 * a dist/ para que `/` no devuelva 404. El SSR completo sigue en .vercel/output.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const staticOut = '.vercel/output/static';
const distRoot = 'dist';

if (!existsSync(staticOut)) {
  console.error('sync-dist: sin .vercel/output/static — el build no generó HTML estático.');
  process.exit(1);
}

mkdirSync(distRoot, { recursive: true });

for (const name of readdirSync(staticOut)) {
  const from = join(staticOut, name);
  const to = join(distRoot, name);
  cpSync(from, to, { recursive: true, force: true });
}

if (!existsSync(join(distRoot, 'index.html'))) {
  console.error('sync-dist: no hay dist/index.html tras copiar desde .vercel/output/static');
  process.exit(1);
}

console.log('sync-dist: dist/index.html listo (fallback si Output Directory = dist en Vercel)');
