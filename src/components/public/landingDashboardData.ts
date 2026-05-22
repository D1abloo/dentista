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
  LayoutDashboard,
  LineChart,
  Receipt,
  Settings,
  Stethoscope,
  Users
} from 'lucide-react';

export type LandingDashNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

/** Navegación principal del panel (como en /admin). */
export const landingDashNav: LandingDashNavItem[] = [
  { label: 'Inicio', icon: LayoutDashboard, href: '/admin', active: true },
  { label: 'Agenda', icon: CalendarDays, href: '/admin/agenda' },
  { label: 'Citas', icon: Calendar, href: '/admin/citas' },
  { label: 'Pacientes', icon: Users, href: '/admin/pacientes' },
  { label: 'Informes', icon: FileText, href: '/admin/informes' },
  { label: 'Consentim.', icon: FileSignature, href: '/admin/consentimientos' },
  { label: 'Documentos', icon: FileStack, href: '/admin/documentos' },
  { label: 'Facturas', icon: Receipt, href: '/admin/facturas' },
  { label: 'Pagos', icon: CreditCard, href: '/admin/pagos' },
  { label: 'Dentistas', icon: Stethoscope, href: '/admin/dentistas' },
  { label: 'Tratamientos', icon: ClipboardList, href: '/admin/tratamientos' },
  { label: 'Clínicas', icon: Building2, href: '/admin/clinicas' },
  { label: 'Reportes', icon: LineChart, href: '/admin/reportes' },
  { label: 'Configuración', icon: Settings, href: '/admin/configuracion' }
];

export const landingDashQuickModules = [
  { label: 'Agenda', icon: CalendarDays, href: '/admin/agenda' },
  { label: 'Pacientes', icon: Users, href: '/admin/pacientes' },
  { label: 'Facturas', icon: Receipt, href: '/admin/facturas' },
  { label: 'Pagos', icon: CreditCard, href: '/admin/pagos' },
  { label: 'Informes', icon: FileText, href: '/admin/informes' },
  { label: 'Reportes', icon: LineChart, href: '/admin/reportes' }
] as const;

export const landingDashActions = [
  { label: 'Nuevo paciente', href: '/admin/pacientes' },
  { label: 'Nueva cita', href: '/admin/citas' },
  { label: 'Emitir factura', href: '/admin/facturas' }
] as const;
