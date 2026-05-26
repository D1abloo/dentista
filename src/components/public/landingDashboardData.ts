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
  { label: 'Dr/Dra', icon: Stethoscope, href: '/admin/profesionales' },
  { label: 'Tratamientos', icon: ClipboardList, href: '/admin/tratamientos' },
  { label: 'Clínicas', icon: Building2, href: '/admin/clinicas' },
  { label: 'Reportes', icon: LineChart, href: '/admin/reportes' },
  { label: 'Notificaciones', icon: Bell, href: '/admin/notificaciones' },
  { label: 'Ajustes', icon: Settings, href: '/login/admin' }
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
  { label: 'Pacientes', href: '/admin/pacientes' },
  { label: 'Nueva cita', href: '/admin/citas' },
  { label: 'Emitir factura', href: '/admin/facturas' }
] as const;

export const landingDashInsightKpis = [
  { label: 'Citas hoy', value: '28', hint: '+12% vs ayer', tone: 'default' as const },
  { label: 'Ingresos del mes', value: '28.450 €', hint: 'Facturación dental', tone: 'coral' as const },
  { label: 'Facturas pendientes', value: '12', hint: '1.850 € por cobrar', tone: 'default' as const },
  { label: 'Ocupación agenda', value: '86%', hint: 'Huecos reales', tone: 'teal' as const }
] as const;

export const landingDashFeatureLines = [
  {
    title: 'Agenda conectada',
    text: 'Reservas online, bloqueos y estados de cita en el mismo calendario.'
  },
  {
    title: 'Portal paciente sincronizado',
    text: 'Informes, facturas y mensajes visibles para el paciente al publicarlos.'
  },
  {
    title: 'Facturación integrada',
    text: 'Facturas PDF, pagos y recibos vinculados al historial del paciente.'
  },
  {
    title: 'Informes y documentos',
    text: 'Firma profesional, adjuntos y trazabilidad clínica por visita.'
  }
] as const;

export const landingDashActivity = [
  { time: '09:30', text: 'María López — Revisión · Dra. Martínez' },
  { time: '11:00', text: 'Carlos Ruiz — Endodoncia · Dr. López' },
  { time: '15:00', text: 'Factura FAC-2026-0158 emitida · 120,00 €' }
] as const;
