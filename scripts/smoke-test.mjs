import { existsSync, readFileSync } from 'node:fs';

const required = [
  'AGENTS.md',
  'README.md',
  'docs/MCP.md',
  'docs/PROMPT.md',
  'docs/FRONTEND.md',
  'docs/ROLES.md',
  'docs/MULTI_TENANT.md',
  'docs/PRIVACIDAD.md',
  'docs/LOCALSTORAGE_DEMO.md',
  '.codex/skills/dentalflow/SKILL.md',
  'src/pages/index.astro',
  'src/pages/admin.astro',
  'src/pages/admin/agenda.astro',
  'src/pages/admin/citas.astro',
  'src/pages/admin/pacientes.astro',
  'src/pages/admin/dentistas.astro',
  'src/pages/admin/tratamientos.astro',
  'src/pages/admin/empresa.astro',
  'src/pages/admin/pagos.astro',
  'src/pages/admin/reportes.astro',
  'src/pages/admin/configuracion.astro',
  'src/pages/admin/normativa.astro',
  'src/pages/login.astro',
  'src/pages/cookies.astro',
  'src/pages/privacidad.astro',
  'src/pages/terminos.astro',
  'src/pages/documentacion.astro',
  'src/pages/contacto.astro',
  'src/pages/activar.astro',
  'src/pages/paciente.astro',
  'src/pages/paciente/citas.astro',
  'src/pages/paciente/reservar.astro',
  'src/pages/paciente/historial.astro',
  'src/pages/paciente/perfil.astro',
  'src/pages/paciente/pagos.astro',
  'src/pages/paciente/mensajes.astro',
  'src/pages/reserva.astro',
  'src/pages/api/auth/login.ts',
  'src/pages/api/auth/logout.ts',
  'src/pages/api/auth/me.ts',
  'src/pages/api/appointments.ts',
  'src/pages/api/demo/state.ts',
  'src/lib/supabaseDemo.ts',
  'src/pages/api/notifications/appointment.ts',
  'src/pages/api/admin/metrics.ts',
  'src/pages/api/admin/modules.ts',
  'src/pages/api/availability.ts',
  'src/pages/api/cache/health.ts',
  'src/pages/api/dentists.ts',
  'src/pages/api/locations.ts',
  'src/pages/api/treatments.ts',
  'src/lib/auth.ts',
  'src/lib/activation.ts',
  'src/lib/dataAdapter.ts',
  'src/lib/demoStore.ts',
  'src/lib/notifications.ts',
  'src/data/demoData.ts',
  'src/types/demo.ts',
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/icons/icon-192.svg',
  'public/icons/icon-512.svg',
  'src/lib/database.types.ts',
  'supabase/migrations/0001_schema.sql',
  'supabase/migrations/0003_operations.sql',
  'supabase/migrations/0006_multi_tenant_rls.sql',
  'supabase/migrations/0007_demo_app_state.sql',
  'docs/SUPABASE_DEMO.md',
  'scripts/git-save.sh'
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error('Faltan archivos requeridos:\n' + missing.join('\n'));
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const dep of ['astro', 'react', '@supabase/supabase-js', 'ioredis', 'zod']) {
  if (!pkg.dependencies[dep]) {
    console.error(`Falta dependencia ${dep}`);
    process.exit(1);
  }
}

console.log('Smoke test OK: estructura DentalFlow lista para Codex.');
