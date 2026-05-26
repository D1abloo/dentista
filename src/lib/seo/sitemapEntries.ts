/** Rutas públicas indexables (sin redirecciones ni áreas privadas). */
export const indexablePaths = [
  { loc: '/', changefreq: 'weekly' as const, priority: 1 },
  { loc: '/contacto', changefreq: 'monthly' as const, priority: 0.85 },
  { loc: '/ayuda', changefreq: 'weekly' as const, priority: 0.9 },
  { loc: '/portal-paciente', changefreq: 'monthly' as const, priority: 0.88 },
  { loc: '/registro-clinica', changefreq: 'monthly' as const, priority: 0.82 },
  { loc: '/registro-paciente', changefreq: 'monthly' as const, priority: 0.8 },
  { loc: '/privacidad', changefreq: 'yearly' as const, priority: 0.35 },
  { loc: '/cookies', changefreq: 'yearly' as const, priority: 0.3 },
  { loc: '/terminos', changefreq: 'yearly' as const, priority: 0.35 }
];
