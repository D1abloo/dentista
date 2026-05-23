import type { GuideSection, HelpAudience, HelpAudienceMeta, HelpFaq, HelpQuickLink } from '@/lib/guide/types';
import { helpSectionsByAudience } from '@/lib/guide/hubCatalog';

export type { GuideSection, HelpAudience, HelpFaq, HelpQuickLink } from '@/lib/guide/types';
export { helpSectionsByAudience } from '@/lib/guide/hubCatalog';

export const helpAudiences: HelpAudienceMeta[] = [
  {
    id: 'patient',
    label: 'Paciente',
    hash: 'portal-paciente',
    description: 'Guías para acceder a tu portal, ver citas, informes, documentos y más.'
  },
  {
    id: 'admin',
    label: 'Clínica',
    hash: 'panel-admin',
    description: 'Gestiona tu agenda, pacientes, facturación y portal del paciente.'
  },
  {
    id: 'platform',
    label: 'Administrador',
    hash: 'plataforma',
    description: 'Configuración avanzada, seguridad, auditoría y gestión de la plataforma.'
  }
];

export const helpQuickLinks: HelpQuickLink[] = [
  {
    id: 'register',
    label: 'Registro paciente',
    description: 'Alta con activación por correo.',
    href: '/registro-paciente'
  },
  {
    id: 'login',
    label: 'Iniciar sesión',
    description: 'Acceso paciente o clínica.',
    href: '/login'
  },
  {
    id: 'booking',
    label: 'Reservar cita',
    description: 'Cuenta activada obligatoria.',
    href: '/reserva'
  },
  {
    id: 'clinic-register',
    label: 'Registrar clínica',
    description: 'Solicitud de alta del centro.',
    href: '/registro-clinica'
  },
  {
    id: 'contact',
    label: 'Soporte',
    description: 'Contacto e incidencias.',
    href: '/contacto'
  }
];

export const helpFaqs: HelpFaq[] = [
  {
    id: 'activate',
    audience: 'patient',
    question: '¿Por qué no puedo iniciar sesión tras registrarme?',
    answer:
      'Debes activar la cuenta desde el correo que recibes al registrarte. El enlace caduca a las 48 horas. Revisa también la carpeta de spam.'
  },
  {
    id: 'booking-account',
    audience: 'patient',
    question: '¿Puedo reservar cita sin cuenta?',
    answer: 'No. El registro y la activación por email son obligatorios para reservar online en /reserva.'
  },
  {
    id: 'cancel',
    audience: 'patient',
    question: '¿Cómo cancelo o cambio una cita?',
    answer:
      'Entra en Mis citas del portal. La cancelación online puede tener plazo mínimo (p. ej. 24 h) según la normativa de tu clínica.'
  },
  {
    id: 'pdp-access',
    audience: 'admin',
    question: '¿Cómo veo el portal como el paciente?',
    answer:
      'Desde el panel usa «Portal del paciente» en la barra superior o genera un token en Acceso PdP. Las acciones quedan auditadas.'
  },
  {
    id: 'visibility',
    audience: 'admin',
    question: '¿Por qué el paciente no ve un informe?',
    answer:
      'Comprueba que el documento esté publicado al portal (interruptor de visibilidad en Informes o Documentos).'
  },
  {
    id: 'multi-site',
    audience: 'admin',
    question: '¿Cómo cambio de sede?',
    answer: 'Si gestionas varias clínicas, usa el selector de sede en la barra del panel.'
  },
  {
    id: 'support',
    audience: 'all',
    question: '¿Dónde contacto con soporte?',
    answer: 'Usa el formulario en /contacto indicando si eres paciente o clínica.'
  },
  {
    id: 'docs-patient',
    audience: 'patient',
    question: '¿Dónde descargo mis informes o facturas?',
    answer: 'En el portal paciente, secciones Informes, Documentos y Facturas. Solo verás lo publicado por tu clínica.'
  },
  {
    id: 'consent-faq',
    audience: 'patient',
    question: '¿Cómo firmo un consentimiento?',
    answer: 'Abre Consentimientos en el menú del portal y pulsa Leer y firmar en cada documento pendiente.'
  },
  {
    id: 'invoice-admin',
    audience: 'admin',
    question: '¿Cómo emito una factura al paciente?',
    answer: 'En Facturación crea FAC-XXXX vinculada al paciente y tratamiento. El PDF puede incluir el logo de tu clínica.'
  },
  {
    id: 'platform-access',
    audience: 'platform',
    question: '¿Quién puede acceder al panel de plataforma?',
    answer: 'Solo cuentas de administrador global autorizadas por Dentista+. No es visible para pacientes ni personal de clínica.'
  }
];

export function getSection(audience: HelpAudience, sectionId: string): GuideSection | undefined {
  return helpSectionsByAudience[audience].find((s) => s.id === sectionId);
}

export type HelpRoute = {
  audience: HelpAudience;
  sectionId: string | null;
  showFaq: boolean;
};

export function parseHelpHash(hash: string): HelpRoute {
  const raw = hash.replace(/^#/, '').trim();

  if (raw === 'faq') {
    return { audience: 'patient', sectionId: null, showFaq: true };
  }

  if (!raw || raw === 'portal-paciente' || raw === 'paciente') {
    return { audience: 'patient', sectionId: null, showFaq: false };
  }

  if (raw === 'panel-admin' || raw === 'admin' || raw === 'clinica') {
    return { audience: 'admin', sectionId: null, showFaq: false };
  }

  if (raw === 'plataforma' || raw === 'platform' || raw === 'administrador') {
    return { audience: 'platform', sectionId: null, showFaq: false };
  }

  if (raw === 'documentacion' || raw === 'docs') {
    return { audience: 'patient', sectionId: null, showFaq: false };
  }

  if (helpSectionsByAudience.platform.some((s) => s.id === raw)) {
    return { audience: 'platform', sectionId: raw, showFaq: false };
  }

  if (helpSectionsByAudience.admin.some((s) => s.id === raw)) {
    return { audience: 'admin', sectionId: raw, showFaq: false };
  }

  if (helpSectionsByAudience.patient.some((s) => s.id === raw)) {
    return { audience: 'patient', sectionId: raw, showFaq: false };
  }

  return { audience: 'patient', sectionId: null, showFaq: false };
}

export function helpHashAudience(audience: HelpAudience): string {
  const h = helpAudiences.find((a) => a.id === audience)?.hash ?? 'portal-paciente';
  return `#${h}`;
}

export function helpHashSection(sectionId: string): string {
  return `#${sectionId}`;
}

export function helpHashFaq(): string {
  return '#faq';
}

export function faqsForAudience(audience: HelpAudience): HelpFaq[] {
  return helpFaqs.filter((f) => f.audience === 'all' || f.audience === audience);
}

export function faqsPatientAndClinic(): HelpFaq[] {
  return helpFaqs.filter((f) => f.audience === 'all' || f.audience === 'patient' || f.audience === 'admin');
}

export function sectionThumb(section: GuideSection): string {
  const shot = section.screenshots[0]?.src;
  if (shot) return shot;
  const firstStep = section.steps.find((s) => s.shot);
  if (firstStep?.shot) return `/images/guides/mobile/${firstStep.shot}.png`;
  return '/images/guides/mobile/pdp-inicio.png';
}
