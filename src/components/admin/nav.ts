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
  | 'monitorizacion';

export const adminNav: { href: string; label: string; icon: LucideIcon; view: AdminView }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
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
    'Resumen de actividad de tu organización. Consulta la guía de uso para el panel y el portal del paciente.',
  agenda: 'Vista día, semana o mes',
  citas: 'CIT-XXXX vinculadas a paciente',
  pacientes:
    'Gestiona expedientes, citas, documentos, facturas y acceso al portal del paciente.',
  informes: 'Sube PDF · busca por DNI o PAT-XXXX',
  documentos: 'Sube, clasifica y comparte documentos clínicos con cada paciente.',
  facturas: 'Gestiona facturas, cobros, vencimientos y PDFs vinculados a cada paciente.',
  pagos: 'PAG-XXXX · búsqueda por DNI o ID paciente',
  dentistas: 'Equipo clínico de la sede',
  profesionales: 'Colegiado, especialidad y datos para informes clínicos',
  tratamientos: 'Catálogo y precios',
  clinicas: 'Organización y sedes',
  reportes: 'Analiza citas, tratamientos, ingresos, ocupación y rendimiento de tu clínica.',
  normativa: 'Textos legales visibles al paciente',
  notificaciones: 'Avisos de pacientes, citas, documentos, facturas, pagos y portal',
  configuracion: 'Identidad, facturación, portal del paciente y preferencias',
  'acceso-portal': 'Tokens de acceso al portal del paciente (sin historial)',
  'auditoria-pdp': 'Registro de actividad por profesional · exportar Excel',
  usuarios: 'Alta de personal vinculado a la clínica',
  consentimientos: 'Firma obligatoria del paciente en el portal',
  monitorizacion: 'Actividad de tu clínica · logins · seguridad · especificación del sistema'
};
