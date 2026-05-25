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
    id: 'login-fail',
    audience: 'patient',
    question: '¿Por qué no puedo iniciar sesión?',
    answer:
      'Comprueba email y contraseña. Si acabas de registrarte, activa la cuenta desde el correo (48 h). Si persiste, contacta con tu clínica o soporte.'
  },
  {
    id: 'activate',
    audience: 'patient',
    question: '¿Por qué no puedo iniciar sesión tras registrarme?',
    answer:
      'Debes activar la cuenta desde el correo que recibes al registrarte. El enlace caduca a las 48 horas. Revisa también la carpeta de spam antes de volver a intentar el acceso.'
  },
  {
    id: 'booking-account',
    audience: 'patient',
    question: '¿Puedo reservar cita sin cuenta?',
    answer: 'No. El registro y la activación por email son obligatorios para reservar online en /reserva.'
  },
  {
    id: 'reports-where',
    audience: 'patient',
    question: '¿Dónde veo mis informes?',
    answer: 'En el portal del paciente, menú Informes. Solo aparecen los que tu clínica ha publicado para ti.'
  },
  {
    id: 'invoices-download',
    audience: 'patient',
    question: '¿Cómo descargo mis facturas?',
    answer: 'Abre Facturas y pagos en el portal. Desde cada factura puedes ver el detalle y descargar el PDF si está disponible.'
  },
  {
    id: 'cancel',
    audience: 'patient',
    question: '¿Cómo cancelo o cambio una cita?',
    answer:
      'Entra en el Portal del Paciente, abre Mis citas y selecciona la cita que quieres cancelar o modificar. Si la clínica no permite cambios online, contacta con soporte.'
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
      'Comprueba que el informe está vinculado al paciente correcto, que pertenece a la clínica correcta y que está marcado como visible en el Portal del Paciente.'
  },
  {
    id: 'create-appointment',
    audience: 'admin',
    question: '¿Cómo creo una cita?',
    answer: 'En Agenda pulsa Nueva cita, elige paciente, profesional, tratamiento y hueco libre. Confirma para notificar al paciente si está configurado.'
  },
  {
    id: 'block-slot',
    audience: 'admin',
    question: '¿Cómo bloqueo un horario?',
    answer: 'En Agenda usa Bloquear horario: selecciona fecha, franja y opcionalmente profesional o gabinete afectado.'
  },
  {
    id: 'logo-change',
    audience: 'admin',
    question: '¿Cómo cambio el logo de la clínica?',
    answer: 'En Configuración → Marca y logo sube una imagen en formato recomendado. Se refleja en facturas y portal si está activado.'
  },
  {
    id: 'multi-site',
    audience: 'admin',
    question: '¿Cómo cambio de sede?',
    answer:
      'Usa el selector de clínica o sede en la barra superior del panel. Solo verás las sedes a las que tu usuario tenga acceso.'
  },
  {
    id: 'support',
    audience: 'all',
    question: '¿Dónde contacto con soporte?',
    answer: 'Usa /contacto?tipo=soporte o el email de soporte publicado en esa página.'
  },
  {
    id: 'support-patient',
    audience: 'patient',
    question: '¿Dónde contacto con soporte?',
    answer:
      'Puedes contactar con soporte desde el Centro de ayuda, desde la sección Ayuda del portal o usando el botón Contactar soporte.'
  },
  {
    id: 'support-clinic',
    audience: 'admin',
    question: '¿Dónde contacto con soporte?',
    answer:
      'Desde el panel clínico puedes abrir Soporte o Contactar soporte. Incluye la clínica, paciente o recurso afectado para acelerar la revisión.'
  },
  {
    id: 'docs-patient',
    audience: 'patient',
    question: '¿Dónde descargo mis informes o facturas?',
    answer:
      'Entra en el Portal del Paciente y abre Mis informes, Mis documentos o Mis facturas. Solo verás los archivos que la clínica haya marcado como visibles para ti.'
  },
  {
    id: 'consent-faq',
    audience: 'patient',
    question: '¿Cómo firmo un consentimiento?',
    answer:
      'Accede a Consentimientos en tu portal, abre el documento pendiente, confirma que lo has leído y firma digitalmente antes de guardar.'
  },
  {
    id: 'invoice-admin',
    audience: 'admin',
    question: '¿Cómo emito una factura al paciente?',
    answer:
      'Abre Facturación, crea una nueva factura, selecciona paciente y concepto, genera el PDF y marca si será visible en el Portal del Paciente.'
  },
  {
    id: 'platform-access',
    audience: 'platform',
    question: '¿Quién puede acceder al panel de plataforma?',
    answer: 'Solo cuentas de administrador global autorizadas por AgendaClinic. No es visible para pacientes ni personal de clínica.'
  },
  {
    id: 'org-multi',
    audience: 'platform',
    question: '¿Cómo creo una organización multi-sede?',
    answer: 'En Plataforma → Organizaciones crea la entidad y asocia cada clínica como sede independiente con su propio clinic_id.'
  },
  {
    id: 'roles-review',
    audience: 'platform',
    question: '¿Cómo reviso usuarios y roles?',
    answer: 'Desde Clínicas o Usuarios filtra por centro y revisa perfiles staff. Los cambios de rol aplican solo a esa clínica.'
  },
  {
    id: 'audit-how',
    audience: 'platform',
    question: '¿Cómo consulto auditoría?',
    answer: 'Abre el módulo Auditoría y filtra por clínica, tipo de evento o fecha. Las inspecciones de clínica quedan registradas.'
  },
  {
    id: 'monitoring-how',
    audience: 'platform',
    question: '¿Cómo funciona la monitorización?',
    answer: 'El panel de monitorización muestra estado de servicios y colas. Las alertas se vinculan a tickets de soporte si hay incidencia.'
  },
  {
    id: 'data-isolation',
    audience: 'platform',
    question: '¿Cómo se evita el cruce de datos entre clínicas?',
    answer: 'Cada registro operativo incluye clinic_id y políticas RLS en base de datos. El personal solo ve datos de sus clínicas asignadas.'
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
