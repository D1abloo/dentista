import { BRAND_SEO, absoluteUrl } from '@/lib/seo/siteConfig'

export type BreadcrumbItem = {
  name: string
  path: string
}

export const breadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path)
  }))
})

export const publicBreadcrumb = (current: { name: string; path: string }) =>
  breadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    current
  ])

export const aiAssistantWebAppLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `${BRAND_SEO.name} — Asistente de citas con IA`,
  url: absoluteUrl('/citas-con-ia'),
  applicationCategory: 'MedicalApplication',
  operatingSystem: 'Web',
  inLanguage: 'es',
  description:
    'Asistente con IA para reservar, consultar, cambiar o cancelar citas dentales de forma segura.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR'
  }
}
