export type PortalChoiceId = 'admin' | 'patient' | 'platform'

export type PortalChoiceOption = {
  id: PortalChoiceId
  label: string
  description: string
  href: string
}

/** Opciones por defecto cuando super_admin aún no tiene perfiles enlazados en Supabase. */
export const SUPER_ADMIN_PORTAL_OPTIONS: PortalChoiceOption[] = [
  {
    id: 'platform',
    label: 'Plataforma AgendaClinic',
    description: 'Super administración SaaS, clínicas y soporte',
    href: '/platform'
  },
  {
    id: 'admin',
    label: 'Panel administrativo',
    description: 'Agenda, pacientes, facturación y configuración',
    href: '/admin/elegir-centro'
  },
  {
    id: 'patient',
    label: 'Portal del paciente',
    description: 'Citas, documentos clínicos y pagos',
    href: '/paciente'
  }
]
