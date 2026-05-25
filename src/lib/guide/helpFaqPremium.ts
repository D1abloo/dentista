import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  CalendarClock,
  Eye,
  FileStack,
  Headphones,
  LogIn,
  PenLine,
  Receipt
} from 'lucide-react';

export type HelpFaqHubItem = {
  id: string;
  question: string;
  answer: string;
  icon: LucideIcon;
};

/** FAQ destacadas del hub (pacientes) — orden y textos del centro de ayuda. */
export const helpFaqHubPatient: HelpFaqHubItem[] = [
  {
    id: 'activate',
    icon: LogIn,
    question: '¿Por qué no puedo iniciar sesión tras registrarme?',
    answer:
      'Debes activar la cuenta desde el correo que recibes al registrarte. El enlace caduca a las 48 horas. Revisa también la carpeta de spam antes de volver a intentar el acceso.'
  },
  {
    id: 'booking-account',
    icon: Calendar,
    question: '¿Puedo reservar cita sin cuenta?',
    answer: 'No. El registro y la activación por email son obligatorios para reservar online en /reserva.'
  },
  {
    id: 'cancel',
    icon: CalendarClock,
    question: '¿Cómo cancelo o cambio una cita?',
    answer:
      'Entra en el Portal del Paciente, abre Mis citas y selecciona la cita que quieres cancelar o modificar. Si la clínica no permite cambios online, contacta con soporte.'
  },
  {
    id: 'support-patient',
    icon: Headphones,
    question: '¿Dónde contacto con soporte?',
    answer:
      'Puedes contactar con soporte desde el Centro de ayuda, desde la sección Ayuda del portal o usando el botón Contactar soporte.'
  },
  {
    id: 'docs-patient',
    icon: FileStack,
    question: '¿Dónde descargo mis informes o facturas?',
    answer:
      'Entra en el Portal del Paciente y abre Mis informes, Mis documentos o Mis facturas. Solo verás los archivos que la clínica haya marcado como visibles para ti.'
  },
  {
    id: 'consent-faq',
    icon: PenLine,
    question: '¿Cómo firmo un consentimiento?',
    answer:
      'Accede a Consentimientos en tu portal, abre el documento pendiente, confirma que lo has leído y firma digitalmente antes de guardar.'
  }
];

/** FAQ destacadas del hub (clínicas) — 5 temas. */
export const helpFaqHubClinic: HelpFaqHubItem[] = [
  {
    id: 'pdp-access',
    icon: Eye,
    question: '¿Cómo veo el portal como el paciente?',
    answer:
      'Desde el panel usa «Portal del paciente» en la barra superior o genera un token en Acceso PdP. Las acciones quedan auditadas.'
  },
  {
    id: 'visibility',
    icon: FileStack,
    question: '¿Por qué el paciente no ve un informe?',
    answer:
      'Comprueba que el informe está vinculado al paciente correcto, que pertenece a la clínica correcta y que está marcado como visible en el Portal del Paciente.'
  },
  {
    id: 'multi-site',
    icon: Building2,
    question: '¿Cómo cambio de sede?',
    answer:
      'Usa el selector de clínica o sede en la barra superior del panel. Solo verás las sedes a las que tu usuario tenga acceso.'
  },
  {
    id: 'support-clinic',
    icon: Headphones,
    question: '¿Dónde contacto con soporte?',
    answer:
      'Desde el panel clínico puedes abrir Soporte o Contactar soporte. Incluye la clínica, paciente o recurso afectado para acelerar la revisión.'
  },
  {
    id: 'invoice-admin',
    icon: Receipt,
    question: '¿Cómo emito una factura al paciente?',
    answer:
      'Abre Facturación, crea una nueva factura, selecciona paciente y concepto, genera el PDF y marca si será visible en el Portal del Paciente.'
  }
];

export const helpFaqHubDefaultOpen: Record<'patient' | 'admin', string> = {
  patient: 'activate',
  admin: 'pdp-access'
};

export function searchHubFaqs(query: string): HelpFaqHubItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [...helpFaqHubPatient, ...helpFaqHubClinic].filter(
    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
  );
}
