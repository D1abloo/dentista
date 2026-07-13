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
import { adminNav, adminSubtitles, adminTitles } from '@/components/admin/nav'
import { PortalShell } from '@/frontend/layouts/PortalShell'
import { PageState } from '@/frontend/ds'
import { useOnline } from '@/frontend/hooks/useAsync'
import { ShellPageHeader } from '@/frontend/shell/components/ShellPageHeader'
import { buildAdminNavGroups } from '@/frontend/shell/nav/adminNavGroups'
import { AdminDashboardView } from './views/AdminDashboardView'
import { AdminPatientsView } from './views/AdminPatientsView'
import { AdminAppointmentsView } from './views/AdminAppointmentsView'
import { AdminGenericModuleView } from './views/AdminGenericModuleView'
import { AdminPortalAccess } from '@/components/admin/portalAccess'
import { isTokenFeaturesEnabled } from '@/lib/featureFlags'

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
      <div className="p-4 sm:p-6">
        <PageState
          variant="offline"
          title="Sin conexión"
          description="Comprueba tu red e inténtalo de nuevo."
        />
      </div>
    )
  }

  const content = (() => {
    if (view === 'dashboard') return <AdminDashboardView />
    if (view === 'pacientes' && patientId) return <AdminPatientsView focusId={patientId} />
    if (view === 'pacientes') return <AdminPatientsView />
    if (view === 'citas') return <AdminAppointmentsView />
    if (view === 'acceso-portal') {
      if (!isTokenFeaturesEnabled()) {
        return (
          <PageState
            variant="empty"
            title="Acceso por token desactivado"
            description="Usa el login de paciente o la gestión clínica para acceder al portal del paciente."
          />
        )
      }
      return <AdminPortalAccess />
    }
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
          description={adminSubtitles[view]}
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
  })()

  return <div className="pf-animate-in p-4 sm:p-6">{content}</div>
}

function AdminAppInner({ view, patientId }: { view: AdminView; patientId?: string }) {
  const tenant = useTenant()
  const { staffRole } = useStaffContext()
  const logout = useLogout()

  const visibleNav = useMemo(
    () => adminNav.filter((item) => isNavItemVisible(item.view, staffRole)),
    [staffRole]
  )

  const nav = useMemo(
    () => visibleNav.map((item) => ({ href: item.href, label: item.label, icon: item.icon })),
    [visibleNav]
  )

  const navGroups = useMemo(() => buildAdminNavGroups(visibleNav), [visibleNav])

  return (
    <PortalShell
      brand="Panel clínica"
      subtitle={tenant.name}
      nav={nav}
      navGroups={navGroups}
      pageTitle={adminTitles[view]}
      breadcrumbRoot={{ label: 'Clínica', href: '/admin' }}
      sidebarStorageKey="ac_admin_sidebar_collapsed"
      userLabel={tenant.subtitle}
      onLogout={logout}
      searchPlaceholder="Buscar pacientes, citas, facturas…"
    >
      <ShellPageHeader title={adminTitles[view]} description={adminSubtitles[view]} />
      <Body view={view} patientId={patientId} />
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
