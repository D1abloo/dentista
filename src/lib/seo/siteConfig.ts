/** URL pública del sitio (sin barra final). */
export function getSiteUrl(): string {
  const raw = import.meta.env.PUBLIC_APP_URL?.trim() || 'https://dentista.vercel.app';
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveCanonical(pathname: string): string {
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  return absoluteUrl(path);
}

const PRIVATE_PREFIXES = [
  '/admin',
  '/paciente',
  '/platform',
  '/login',
  '/entrada',
  '/api',
  '/internal'
];

export function isPrivatePath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export const DEFAULT_OG_IMAGE_PATH = '/images/guides/landing/admin-dashboard-hero.png';

export function defaultOgImage(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

export const BRAND_SEO = {
  name: 'AgendaClinic',
  legalName: 'AgendaClinic',
  defaultTitle: 'AgendaClinic | Software dental para citas, pacientes y facturación',
  titleSuffix: 'AgendaClinic',
  defaultDescription:
    'Software dental en la nube para clínicas: agenda, historial de pacientes, informes clínicos, facturación, pagos online y portal del paciente seguro.',
  defaultKeywords:
    'software dental, agenda dental online, programa gestión clínica dental, software odontológico, portal paciente dental, citas dentales online, facturación clínica dental, informes odontológicos digitales, SaaS dental España'
} as const;
