import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const problems = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', '.astro', '.git'].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx|astro|mjs|sql|md)$/.test(name)) {
      const content = readFileSync(path, 'utf8');
      if (content.includes('YOUR_' + 'SERVICE_ROLE_KEY') && !path.endsWith('.env.example')) problems.push(`Placeholder sensible fuera de .env.example: ${path}`);
      if (content.includes('console.log(') && path.includes('/src/')) problems.push(`console.log en src: ${path}`);
    }
  }
}
walk(root);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('lint-light OK');
