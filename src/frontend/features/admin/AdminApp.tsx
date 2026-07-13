import { useMemo } from 'react'
import { DemoStoreProvider } from '@/hooks/useDemoStore'
import { NoticeProvider } from '@/hooks/useNotice'
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate'
import { RoleGate } from '@/components/auth/RoleGate'
import { useLogout } from '@/components/auth/RoleGate'
import { useTenant } from '@/hooks/useTenant'
import { useStaffContext } from '@/hooks/useStaffContext'
import { isNavItemVisible } from '@/lib/adminNav'
import type { AdminView } from '@/components/admin/nav'
import { adminNav, adminTitles } from '@/components/admin/nav'
import { PortalShell } from '@/frontend/layouts/PortalShell'
import { Container, PageHeader, PageState } from '@/frontend/ds'
import { useOnline } from '@/frontend/hooks/useAsync'
import { AdminDashboardView } from './views/AdminDashboardView'
import { AdminPatientsView } from './views/AdminPatientsView'
import { AdminAppointmentsView } from './views/AdminAppointmentsView'
import { AdminGenericModuleView } from './views/AdminGenericModuleView'

const viewApiMap: Partial<Record<AdminView, string>> = {
  agenda: '/api/appointments',
  informes: '/api/admin/clinical-reports',
  consentimientos: '/api/admin/consents',
  documentos: '/api/admin/documents',
  facturas: '/api/admin/invoices',
  pagos: '/api/admin/payments',
  reportes: '/api/admin/reports',
  normativa: '/api/admin/compliance',
  notificaciones: '/api/admin/notifications',
  configuracion: '/api/clinic/bootstrap',
  'acceso-portal': '/api/admin/portal-access',
  'auditoria-pdp': '/api/admin/pdp-audit',
  monitorizacion: '/api/admin/monitoring',
  usuarios: '/api/clinic/users',
  dentistas: '/api/dentists',
  profesionales: '/api/clinic/clinical-professionals',
  tratamientos: '/api/treatments',
  clinicas: '/api/clinic/branches'
}

function Body({ view, patientId }: { view: AdminView; patientId?: string }) {
  const online = useOnline()

  if (!online) {
    return (
      <PageState
        variant="offline"
        title="Sin conexión"
        description="Comprueba tu red e inténtalo de nuevo."
      />
    )
  }

  if (view === 'dashboard') return <AdminDashboardView />
  if (view === 'pacientes' && patientId) return <AdminPatientsView focusId={patientId} />
  if (view === 'pacientes') return <AdminPatientsView />
  if (view === 'citas') return <AdminAppointmentsView />
  if (view === 'operaciones') {
    return (
      <AdminGenericModuleView
        title="Operaciones clínicas"
        description="Hub de operaciones del día."
        endpoint="/api/admin/metrics"
      />
    )
  }

  const endpoint = viewApiMap[view]
  if (endpoint) {
    return (
      <AdminGenericModuleView
        title={adminTitles[view]}
        endpoint={endpoint}
      />
    )
  }

  return (
    <PageState
      variant="empty"
      title={adminTitles[view]}
      description="Módulo disponible en esta versión del panel. Usa la navegación para otros apartados."
    />
  )
}

function AdminAppInner({ view, patientId }: { view: AdminView; patientId?: string }) {
  const tenant = useTenant()
  const { staffRole } = useStaffContext()
  const logout = useLogout()

  const nav = useMemo(
    () =>
      adminNav
        .filter((item) => isNavItemVisible(item.view, staffRole))
        .map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon
        })),
    [staffRole]
  )

  return (
    <PortalShell
      brand="Panel clínica"
      subtitle={tenant.name}
      nav={nav}
      userLabel={tenant.subtitle}
      onLogout={logout}
    >
      <Container size="full" className="!px-0">
        <PageHeader title={adminTitles[view]} />
        <Body view={view} patientId={patientId} />
      </Container>
    </PortalShell>
  )
}

export const AdminApp = ({ view, patientId }: { view: AdminView; patientId?: string }) => (
  <DemoStoreProvider>
    <NoticeProvider>
      <RoleGate roles={['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist', 'super_admin']}>
        <PasswordChangeGate>
          <AdminAppInner view={view} patientId={patientId} />
        </PasswordChangeGate>
      </RoleGate>
    </NoticeProvider>
  </DemoStoreProvider>
)
