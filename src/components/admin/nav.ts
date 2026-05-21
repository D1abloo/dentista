import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  FileSignature,
  BookOpen,
  KeyRound,
  LayoutDashboard,
  Receipt,
  Scale,
  Settings,
  Stethoscope,
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
  | 'tratamientos'
  | 'clinicas'
  | 'reportes'
  | 'normativa'
  | 'configuracion'
  | 'acceso-portal'
  | 'ayuda'
  | 'consentimientos';

export const adminNav: { href: string; label: string; icon: LucideIcon; view: AdminView }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, view: 'agenda' },
  { href: '/admin/citas', label: 'Citas', icon: Calendar, view: 'citas' },
  { href: '/admin/pacientes', label: 'Pacientes', icon: Users, view: 'pacientes' },
  { href: '/admin/informes', label: 'Informes', icon: FileText, view: 'informes' },
  { href: '/admin/consentimientos', label: 'Consentimientos', icon: FileSignature, view: 'consentimientos' },
  { href: '/admin/documentos', label: 'Documentos', icon: FileStack, view: 'documentos' },
  { href: '/admin/facturas', label: 'Facturas', icon: Receipt, view: 'facturas' },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, view: 'pagos' },
  { href: '/admin/dentistas', label: 'Dentistas', icon: Stethoscope, view: 'dentistas' },
  { href: '/admin/tratamientos', label: 'Tratamientos', icon: ClipboardList, view: 'tratamientos' },
  { href: '/admin/clinicas', label: 'Clínicas', icon: Building2, view: 'clinicas' },
  { href: '/admin/reportes', label: 'Reportes', icon: FileText, view: 'reportes' },
  { href: '/admin/normativa', label: 'Normativa', icon: Scale, view: 'normativa' },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings, view: 'configuracion' },
  { href: '/admin/acceso-portal', label: 'Acceso PdP', icon: KeyRound, view: 'acceso-portal' },
  { href: '/admin/ayuda', label: 'Guía de uso', icon: BookOpen, view: 'ayuda' }
];

export const adminTitles: Record<AdminView, string> = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  citas: 'Gestión de citas',
  pacientes: 'Pacientes',
  informes: 'Informes clínicos',
  documentos: 'Documentos',
  facturas: 'Facturas',
  pagos: 'Pagos',
  dentistas: 'Dentistas',
  tratamientos: 'Tratamientos',
  clinicas: 'Clínicas y gabinetes',
  reportes: 'Reportes',
  normativa: 'Normativa',
  configuracion: 'Configuración',
  'acceso-portal': 'Acceso al portal del paciente',
  ayuda: 'Guía de uso del panel',
  consentimientos: 'Consentimientos informados'
};

export const adminSubtitles: Record<AdminView, string> = {
  dashboard: 'Resumen de actividad de tu clínica',
  agenda: 'Vista día, semana o mes',
  citas: 'CIT-XXXX vinculadas a paciente',
  pacientes: 'PAT-XXXX conecta citas, informes, facturas y documentos',
  informes: 'Sube PDF · busca por DNI o PAT-XXXX',
  documentos: 'Radiografías y archivos del paciente',
  facturas: 'FAC-XXXX · solo formato PDF',
  pagos: 'PAG-XXXX · búsqueda por DNI o ID paciente',
  dentistas: 'Equipo clínico de la sede',
  tratamientos: 'Catálogo y precios',
  clinicas: 'Organización y sedes',
  reportes: 'Métricas e ingresos',
  normativa: 'Textos legales visibles al paciente',
  configuracion: 'Datos de contacto, perfil y recordatorios',
  'acceso-portal': 'Tokens y registro de actividad en el PdP',
  ayuda: 'Tutorial con imágenes: PdP, informes, citas y facturación',
  consentimientos: 'Firma obligatoria del paciente en el portal'
};
