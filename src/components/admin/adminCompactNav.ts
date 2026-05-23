import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  FileStack,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Receipt,
  Settings,
  UserRound,
  Users
} from 'lucide-react';
import type { AdminView } from './nav';

export type AdminCompactNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  view: AdminView;
};

/** Navegación compacta del panel (iconos + etiqueta corta). */
export const adminCompactNav: AdminCompactNavItem[] = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard, view: 'dashboard' },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, view: 'agenda' },
  { href: '/admin/pacientes', label: 'Pacientes', icon: Users, view: 'pacientes' },
  { href: '/admin/documentos', label: 'Documentos', icon: FolderOpen, view: 'documentos' },
  { href: '/admin/informes', label: 'Informes', icon: FileText, view: 'informes' },
  { href: '/admin/profesionales', label: 'Perfiles', icon: UserRound, view: 'profesionales' },
  { href: '/admin/facturas', label: 'Facturación', icon: Receipt, view: 'facturas' },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, view: 'pagos' },
  { href: '/admin/reportes', label: 'Estadísticas', icon: BarChart3, view: 'reportes' },
  { href: '/admin/notificaciones', label: 'Notificaciones', icon: Bell, view: 'notificaciones' },
  { href: '/admin/configuracion', label: 'Ajustes', icon: Settings, view: 'configuracion' }
];
