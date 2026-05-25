import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  CalendarClock,
  Eye,
  FileStack,
  Headphones,
  Image,
  Lock,
  LogIn,
  PenLine,
  Receipt,
  Shield,
  Users
} from 'lucide-react';

export type HelpFaqHubItem = {
  id: string;
  question: string;
  answer: string;
  icon: LucideIcon;
};

/** FAQ pacientes — centro de ayuda premium. */
export const helpFaqHubPatient: HelpFaqHubItem[] = [
  {
    id: 'login-fail',
    icon: LogIn,
    question: '¿Por qué no puedo iniciar sesión?',
    answer:
      'Comprueba email y contraseña. Si acabas de registrarte, activa la cuenta desde el correo (48 h). Si persiste, contacta con tu clínica o soporte.'
  },
  {
    id: 'booking-account',
    icon: Calendar,
    question: '¿Puedo reservar cita sin cuenta?',
    answer: 'No. El registro y la activación por email son obligatorios para reservar online en /reserva.'
  },
  {
    id: 'reports-where',
    icon: FileStack,
    question: '¿Dónde veo mis informes?',
    answer:
      'Entra en el Portal del Paciente y abre Informes. Solo verás los informes que tu clínica haya publicado para ti.'
  },
  {
    id: 'invoice-download',
    icon: Receipt,
    question: '¿Cómo descargo mis facturas?',
    answer:
      'En el portal abre Facturas y pagos, selecciona la factura y usa Descargar PDF. Si no aparece, la clínica aún no la ha compartido contigo.'
  },
  {
    id: 'consent-sign',
    icon: PenLine,
    question: '¿Cómo firmo un consentimiento?',
    answer:
      'Accede a Consentimientos, abre el documento pendiente, léelo y confirma la firma digital antes de guardar.'
  }
];

/** FAQ clínicas — centro de ayuda premium. */
export const helpFaqHubClinic: HelpFaqHubItem[] = [
  {
    id: 'create-appt',
    icon: Calendar,
    question: '¿Cómo creo una cita?',
    answer:
      'Abre Agenda, elige paciente, tratamiento y profesional, selecciona hueco libre y confirma. El paciente verá la cita en su portal si está activo.'
  },
  {
    id: 'block-slot',
    icon: CalendarClock,
    question: '¿Cómo bloqueo un horario?',
    answer:
      'En Agenda usa Bloquear horario o marca el intervalo como no disponible. Los pacientes no podrán reservar en ese tramo.'
  },
  {
    id: 'visibility',
    icon: Eye,
    question: '¿Por qué el paciente no ve un informe?',
    answer:
      'Comprueba que el informe está vinculado al paciente correcto, pertenece a tu clínica y está marcado como visible en el Portal del Paciente.'
  },
  {
    id: 'invoice-admin',
    icon: Receipt,
    question: '¿Cómo emito una factura al paciente?',
    answer:
      'Abre Facturación, crea la factura, selecciona paciente y concepto, genera el PDF y márcala visible en el portal si procede.'
  },
  {
    id: 'logo-change',
    icon: Image,
    question: '¿Cómo cambio el logo de la clínica?',
    answer:
      'Ve a Configuración → Logo de la clínica, sube PNG o JPG con fondo transparente (mín. 256×256) y guarda. Se verá en el panel y documentos.'
  }
];

/** FAQ administradores de plataforma. */
export const helpFaqHubAdmin: HelpFaqHubItem[] = [
  {
    id: 'org-multi',
    icon: Building2,
    question: '¿Cómo creo una organización multi-sede?',
    answer:
      'En Plataforma → Organizaciones crea la entidad y asocia cada clínica como sede con su propio identificador aislado.'
  },
  {
    id: 'roles-review',
    icon: Users,
    question: '¿Cómo reviso usuarios y roles?',
    answer:
      'Desde Clínicas o Usuarios filtra por centro y revisa perfiles staff. Los cambios de rol aplican solo a esa clínica.'
  },
  {
    id: 'audit-how',
    icon: Shield,
    question: '¿Cómo consulto auditoría?',
    answer:
      'Abre Auditoría y filtra por clínica, tipo de evento o fecha. Las inspecciones de clínica quedan registradas.'
  },
  {
    id: 'monitoring-how',
    icon: Headphones,
    question: '¿Cómo funciona la monitorización?',
    answer:
      'El panel de monitorización muestra estado de servicios y colas. Las alertas se vinculan a tickets de soporte si hay incidencia.'
  },
  {
    id: 'data-isolation',
    icon: Lock,
    question: '¿Cómo se evita el cruce de datos entre clínicas?',
    answer:
      'Cada registro incluye clinic_id y políticas RLS. El personal solo ve datos de sus clínicas asignadas; los pacientes solo los suyos.'
  }
];

export const helpFaqHubDefaultOpen: Record<'patient' | 'admin' | 'platform', string> = {
  patient: 'login-fail',
  admin: 'create-appt',
  platform: 'org-multi'
};

export function searchHubFaqs(query: string): HelpFaqHubItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [...helpFaqHubPatient, ...helpFaqHubClinic, ...helpFaqHubAdmin].filter(
    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
  );
}
