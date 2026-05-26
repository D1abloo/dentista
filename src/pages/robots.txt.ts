import type { APIRoute } from 'astro';
import { getSiteUrl } from '@/lib/seo/siteConfig';

export const prerender = true;

export const GET: APIRoute = () => {
  const site = getSiteUrl();
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /paciente
Disallow: /platform
Disallow: /login
Disallow: /entrada
Disallow: /api
Disallow: /internal

Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
