import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
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
  | 'configuracion';

export const adminNav: { href: string; label: string; icon: LucideIcon; view: AdminView }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, view: 'agenda' },
  { href: '/admin/citas', label: 'Citas', icon: Calendar, view: 'citas' },
  { href: '/admin/pacientes', label: 'Pacientes', icon: Users, view: 'pacientes' },
  { href: '/admin/informes', label: 'Informes', icon: FileText, view: 'informes' },
  { href: '/admin/documentos', label: 'Documentos', icon: FileStack, view: 'documentos' },
  { href: '/admin/facturas', label: 'Facturas', icon: Receipt, view: 'facturas' },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, view: 'pagos' },
  { href: '/admin/dentistas', label: 'Dentistas', icon: Stethoscope, view: 'dentistas' },
  { href: '/admin/tratamientos', label: 'Tratamientos', icon: ClipboardList, view: 'tratamientos' },
  { href: '/admin/clinicas', label: 'Clínicas', icon: Building2, view: 'clinicas' },
  { href: '/admin/reportes', label: 'Reportes', icon: FileText, view: 'reportes' },
  { href: '/admin/normativa', label: 'Normativa', icon: Scale, view: 'normativa' },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings, view: 'configuracion' }
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
  configuracion: 'Configuración'
};
