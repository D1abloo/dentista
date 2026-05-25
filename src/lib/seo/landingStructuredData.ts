import { landingPlans } from '@/lib/landing/content';

const siteUrl = 'https://dentista.app';

export const landingSoftwareApplicationLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AgendaClinic',
  applicationCategory: 'MedicalBusinessSoftware',
  operatingSystem: 'Web',
  description:
    'Software dental para clínicas que permite gestionar citas, pacientes, agenda, informes, documentos, facturas, pagos, consentimientos y portal del paciente.',
  offers: landingPlans.map((plan) => ({
    '@type': 'Offer',
    name: plan.name,
    description: plan.blurb ?? plan.name,
    price: plan.price === 'A medida' ? undefined : plan.price.replace(/[^\d.,]/g, '') || undefined,
    priceCurrency: plan.price.includes('€') ? 'EUR' : undefined
  }))
};

export const landingOrganizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AgendaClinic',
  url: siteUrl,
  description: 'Plataforma SaaS para digitalización de clínicas dentales.'
};

export const landingWebSiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AgendaClinic',
  url: siteUrl,
  inLanguage: 'es',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/ayuda?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export const landingStructuredDataGraph = [
  landingSoftwareApplicationLd,
  landingOrganizationLd,
  landingWebSiteLd
];
