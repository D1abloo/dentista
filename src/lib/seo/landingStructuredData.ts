import { landingPlans } from '@/lib/landing/content';
import { getSiteUrl } from '@/lib/seo/siteConfig';

const siteUrl = getSiteUrl();

export const landingSoftwareApplicationLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AgendaClinic',
  url: siteUrl,
  applicationCategory: 'MedicalBusinessSoftware',
  operatingSystem: 'Web',
  inLanguage: 'es',
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
  logo: `${siteUrl}/icons/icon-192.svg`,
  description: 'Plataforma SaaS para digitalización de clínicas dentales en España.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['Spanish'],
    url: `${siteUrl}/contacto`
  }
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

export const landingFaqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es AgendaClinic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AgendaClinic es un software dental en la nube para clínicas: agenda de citas, ficha de pacientes, informes clínicos, documentos, facturación, pagos online y portal del paciente con acceso seguro.'
      }
    },
    {
      '@type': 'Question',
      name: '¿Pueden los pacientes reservar citas y ver sus informes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El portal del paciente permite consultar citas, descargar informes y documentos, revisar facturas, realizar pagos y firmar consentimientos compartidos por la clínica.'
      }
    },
    {
      '@type': 'Question',
      name: '¿Es seguro para datos clínicos y cumple RGPD?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cada clínica opera con datos aislados (multi-tenant), controles de acceso por rol y políticas de privacidad y cookies publicadas. La plataforma está diseñada para alinear el tratamiento de datos con el RGPD.'
      }
    },
    {
      '@type': 'Question',
      name: '¿Cómo registro mi clínica dental?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Completa el formulario de alta en la página de registro de clínica. Tras la revisión de la solicitud, recibirás confirmación por email para activar tu panel.'
      }
    },
    {
      '@type': 'Question',
      name: '¿Incluye facturación y cobros online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. AgendaClinic integra facturas, seguimiento de pagos y cobro online cuando la clínica activa los métodos de pago compatibles con su configuración.'
      }
    }
  ]
};

export const landingStructuredDataGraph = [
  landingSoftwareApplicationLd,
  landingOrganizationLd,
  landingWebSiteLd,
  landingFaqLd
];
