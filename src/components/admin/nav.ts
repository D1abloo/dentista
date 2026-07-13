import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  FileSignature,
  BookOpen,
  Activity,
  ClipboardCheck,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Receipt,
  Scale,
  Settings,
  Stethoscope,
  UserRound,
  Users
} from 'lucide-react';

export type AdminView =
  | 'dashboard'
  | 'agenda'
  | 'citas'
  | 'pacientes'
  | 'informes'
  | 'documentos'
  | 'facturas'
  | 'pagos'
  | 'dentistas'
  | 'profesionales'
  | 'tratamientos'
  | 'clinicas'
  | 'reportes'
  | 'normativa'
  | 'configuracion'
  | 'notificaciones'
  | 'acceso-portal'
  | 'auditoria-pdp'
  | 'usuarios'
  | 'consentimientos'
  | 'monitorizacion'
  | 'operaciones';

export const adminNav: { href: string; label: string; icon: LucideIcon; view: AdminView }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { href: '/admin/operaciones', label: 'Operaciones clínicas', icon: Layers3, view: 'operaciones' },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, view: 'agenda' },
  { href: '/admin/citas', label: 'Citas', icon: Calendar, view: 'citas' },
  { href: '/admin/pacientes', label: 'Pacientes', icon: Users, view: 'pacientes' },
  { href: '/admin/informes', label: 'Informes', icon: FileText, view: 'informes' },
  { href: '/admin/consentimientos', label: 'Consentimientos', icon: FileSignature, view: 'consentimientos' },
  { href: '/admin/documentos', label: 'Documentos', icon: FileStack, view: 'documentos' },
  { href: '/admin/facturas', label: 'Facturación', icon: Receipt, view: 'facturas' },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, view: 'pagos' },
  { href: '/admin/profesionales', label: 'Perfiles clínicos', icon: UserRound, view: 'profesionales' },
  { href: '/admin/tratamientos', label: 'Tratamientos', icon: ClipboardList, view: 'tratamientos' },
  { href: '/admin/clinicas', label: 'Clínicas', icon: Building2, view: 'clinicas' },
  { href: '/admin/reportes', label: 'Reportes', icon: FileText, view: 'reportes' },
  { href: '/admin/normativa', label: 'Normativa', icon: Scale, view: 'normativa' },
  { href: '/admin/notificaciones', label: 'Notificaciones', icon: Bell, view: 'notificaciones' },
  { href: '/admin/configuracion', label: 'Ajustes', icon: Settings, view: 'configuracion' },
  { href: '/admin/acceso-portal', label: 'Acceso PdP', icon: KeyRound, view: 'acceso-portal' },
  { href: '/admin/auditoria-pdp', label: 'Auditoría PdP', icon: ClipboardCheck, view: 'auditoria-pdp' },
  { href: '/admin/monitorizacion', label: 'Monitorización', icon: Activity, view: 'monitorizacion' },
  { href: '/admin/usuarios', label: 'Usuarios clínica', icon: Users, view: 'usuarios' },
  { href: '/ayuda#panel-admin', label: 'Guía de uso', icon: BookOpen, view: 'dashboard' }
];

export const adminTitles: Record<AdminView, string> = {
  dashboard: 'Resumen general',
  operaciones: 'Operaciones clínicas',
  agenda: 'Agenda',
  citas: 'Gestión de citas',
  pacientes: 'Pacientes',
  informes: 'Informes clínicos',
  documentos: 'Documentos',
  facturas: 'Facturación',
  pagos: 'Pagos',
  dentistas: 'Dentistas',
  profesionales: 'Perfiles clínicos',
  tratamientos: 'Tratamientos',
  clinicas: 'Clínicas y gabinetes',
  reportes: 'Reportes',
  normativa: 'Normativa',
  notificaciones: 'Notificaciones',
  configuracion: 'Ajustes',
  'acceso-portal': 'Acceso al portal del paciente',
  'auditoria-pdp': 'Auditoría PdP',
  usuarios: 'Usuarios de clínica',
  consentimientos: 'Consentimientos informados',
  monitorizacion: 'Monitorización y registros'
};

export const adminSubtitles: Record<AdminView, string> = {
  dashboard:
    'Visión general de citas, ingresos y actividad de hoy. Ideal para recepción y dirección clínica.',
  operaciones:
    'Flujo unificado de citas, facturación, informes y documentación por paciente.',
  agenda: 'Calendario diario, semanal o mensual con disponibilidad del equipo.',
  citas: 'Consulta, confirma y gestiona citas con historial vinculado al paciente.',
  pacientes:
    'Expediente dental, citas, documentos, facturas y acceso al portal del paciente.',
  informes: 'Informes clínicos en PDF · búsqueda por paciente o identificador.',
  documentos: 'Archivo clínico organizado por paciente, tipo y fecha.',
  facturas: 'Emisión, cobros, vencimientos y envío de PDF al paciente.',
  pagos: 'Registro de cobros, métodos de pago y conciliación con facturas.',
  dentistas: 'Equipo clínico, especialidades y disponibilidad por sede.',
  profesionales: 'Datos colegiales, especialidad y firma en informes clínicos.',
  tratamientos: 'Catálogo de procedimientos, precios y duración estimada.',
  clinicas: 'Organización multi-sede, gabinetes y datos de contacto.',
  reportes: 'Métricas de citas, ingresos, ocupación y rendimiento clínico.',
  normativa: 'Textos legales y avisos visibles para el paciente.',
  notificaciones: 'Alertas de citas, documentos, facturas, pagos y portal.',
  configuracion: 'Identidad de clínica, facturación, portal y preferencias.',
  'acceso-portal': 'Tokens de acceso al portal del paciente.',
  'auditoria-pdp': 'Registro de actividad profesional · exportación Excel.',
  usuarios: 'Personal de clínica, roles y accesos por sede.',
  consentimientos: 'Consentimientos informados con firma del paciente.',
  monitorizacion: 'Actividad, accesos y registros de seguridad del sistema.'
};
