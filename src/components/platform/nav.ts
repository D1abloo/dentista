import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Eye,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-react';

export type PlatformNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export type PlatformNavSection = {
  id: string;
  title: string;
  items: PlatformNavItem[];
};

export const platformNavSections: PlatformNavSection[] = [
  {
    id: 'general',
    title: 'General',
    items: [{ href: '/platform', label: 'Resumen', icon: LayoutDashboard, description: 'KPIs y acciones rápidas' }]
  },
  {
    id: 'clinics',
    title: 'Clínicas y tenants',
    items: [
      { href: '/platform/organizaciones', label: 'Organizaciones', icon: Building2, description: 'Multi-sede por tenant' },
      { href: '/platform/clinicas', label: 'Clínicas', icon: Building2, description: 'Estado, plan y suspensión' },
      { href: '/platform/organizaciones', label: 'Tenants', icon: Lock, description: 'Tenants y aislamiento' },
      { href: '/platform/usuarios', label: 'Usuarios', icon: Users, description: 'Alta de personal y pacientes por clínica' },
      { href: '/platform/incidencias', label: 'Incidencias', icon: Eye, description: 'Revisar panel clínica y PdP con auditoría' },
      { href: '/platform/aislamiento', label: 'Aislamiento', icon: Lock, description: 'Política multi-tenant' }
    ]
  },
  {
    id: 'onboarding',
    title: 'Altas',
    items: [
      { href: '/platform/registros', label: 'Pendientes', icon: ClipboardList, description: 'Solicitudes por aprobar' },
      { href: '/platform/historial', label: 'Historial', icon: History, description: 'Aprobadas y rechazadas' }
    ]
  },
  {
    id: 'ops',
    title: 'Operaciones',
    items: [
      { href: '/platform/suscripciones', label: 'Suscripciones', icon: CreditCard, description: 'Planes SaaS por clínica' },
      { href: '/platform/soporte', label: 'Soporte', icon: LifeBuoy, description: 'Tickets de clínicas' },
      { href: '/platform/metricas', label: 'Métricas', icon: Activity, description: 'Uso agregado sin PHI' }
    ]
  },
  {
    id: 'system',
    title: 'Sistema',
    items: [
      { href: '/platform/configuracion', label: 'Configuración', icon: Settings, description: 'Branding y registro' },
      { href: '/platform/seguridad', label: 'Seguridad', icon: ShieldCheck, description: 'RLS y acceso' },
      { href: '/platform/seguridad', label: 'Auditoría', icon: Eye, description: 'Registro de actividad' }
    ]
  }
];

export const platformNavFlat = platformNavSections.flatMap((s) => s.items);
