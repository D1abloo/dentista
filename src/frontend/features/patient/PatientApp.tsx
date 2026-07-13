import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CreditCard,
  FileSignature,
  FileStack,
  FileText,
  HelpCircle,
  History,
  Home,
  MessageSquare,
  Receipt,
  Stethoscope,
  User
} from 'lucide-react'
import { DemoStoreProvider } from '@/hooks/useDemoStore'
import { NoticeProvider } from '@/hooks/useNotice'
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate'
import { PatientPortalGate } from '@/components/auth/PatientPortalGate'
import { useLogout } from '@/components/auth/RoleGate'
import { PortalShell } from '@/frontend/layouts/PortalShell'
import { Card, PageState } from '@/frontend/ds'
import { useDemoStore } from '@/hooks/useDemoStore'
import { AdminGenericModuleView } from '@/frontend/features/admin/views/AdminGenericModuleView'
import { ShellPageHeader } from '@/frontend/shell/components/ShellPageHeader'
import { buildPatientNavGroups } from '@/frontend/shell/nav/patientNavGroups'

export type PatientView =
  | 'dashboard'
  | 'reservar'
  | 'citas'
  | 'citas-pasadas'
  | 'citas-completadas'
  | 'historial'
  | 'informes'
  | 'documentos'
  | 'facturas'
  | 'perfil'
  | 'pagos'
  | 'mensajes'
  | 'ayuda'
  | 'consentimientos'
  | 'gestion-clinica'

const titles: Record<PatientView, string> = {
  dashboard: 'Inicio',
  reservar: 'Reservar cita',
  citas: 'Mis citas',
  'citas-pasadas': 'Citas pasadas',
  'citas-completadas': 'Citas completadas',
  historial: 'Historial',
  informes: 'Mis informes',
  documentos: 'Mis documentos',
  facturas: 'Mis facturas',
  perfil: 'Mi perfil',
  pagos: 'Mis pagos',
  mensajes: 'Mensajes',
  ayuda: 'Ayuda',
  consentimientos: 'Consentimientos',
  'gestion-clinica': 'Gestión clínica'
}

const descriptions: Partial<Record<PatientView, string>> = {
  dashboard: 'Resumen de tus citas y accesos rápidos a servicios de la clínica.',
  reservar: 'Reserva una nueva cita con el asistente IA o contactando con tu clínica.',
  citas: 'Consulta y gestiona tus próximas citas dentales.',
  informes: 'Informes clínicos compartidos por tu equipo dental.',
  documentos: 'Documentación y archivos de tu expediente.',
  facturas: 'Facturas emitidas y estado de pago.',
  pagos: 'Historial de pagos y métodos registrados.',
  perfil: 'Datos personales y preferencias de contacto.',
  mensajes: 'Comunicación con tu clínica.',
  consentimientos: 'Consentimientos informados pendientes o firmados.',
  'gestion-clinica': 'Acceso rápido al panel de administración clínica.'
}

const baseNav = [
  { href: '/paciente', label: 'Inicio', icon: Home, view: 'dashboard' as const },
  { href: '/paciente/reservar', label: 'Reservar cita', icon: CalendarPlus, view: 'reservar' as const },
  { href: '/paciente/citas', label: 'Mis citas', icon: Calendar, view: 'citas' as const },
  { href: '/paciente/citas-pasadas', label: 'Citas pasadas', icon: CalendarClock, view: 'citas-pasadas' as const },
  { href: '/paciente/citas-completadas', label: 'Completadas', icon: CalendarCheck, view: 'citas-completadas' as const },
  { href: '/paciente/informes', label: 'Informes', icon: FileText, view: 'informes' as const },
  { href: '/paciente/documentos', label: 'Documentos', icon: FileStack, view: 'documentos' as const },
  { href: '/paciente/facturas', label: 'Facturas', icon: Receipt, view: 'facturas' as const },
  { href: '/paciente/pagos', label: 'Pagos', icon: CreditCard, view: 'pagos' as const },
  { href: '/paciente/historial', label: 'Historial', icon: History, view: 'historial' as const },
  { href: '/paciente/mensajes', label: 'Mensajes', icon: MessageSquare, view: 'mensajes' as const },
  { href: '/paciente/consentimientos', label: 'Consentimientos', icon: FileSignature, view: 'consentimientos' as const },
  { href: '/paciente/perfil', label: 'Perfil', icon: User, view: 'perfil' as const },
  { href: '/ayuda#portal-paciente', label: 'Ayuda', icon: HelpCircle, view: 'ayuda' as const }
]

const PatientHome = () => {
  const { state } = useDemoStore()
  const upcoming = state.appointments.filter((a) => a.status === 'confirmed').slice(0, 3)
  return (
    <div className="pf-stagger grid gap-4 lg:grid-cols-2">
      <Card className="pf-card pf-card--lift pf-animate-in p-5">
        <h2 className="font-semibold text-ink">Próximas citas</h2>
        {upcoming.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((a) => (
              <li key={a.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">{a.treatment}</span>
                <span className="text-slate-500">
                  {a.date} {a.time}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No tienes citas confirmadas.</p>
        )}
      </Card>
      <Card className="pf-card pf-card--lift pf-animate-in p-5">
        <h2 className="font-semibold text-ink">Acciones rápidas</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/paciente/reservar"
            className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Reservar
          </a>
          <a
            href="/citas-con-ia"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
          >
            Asistente IA
          </a>
        </div>
      </Card>
    </div>
  )
}

const Body = ({ view }: { view: PatientView }) => {
  if (view === 'dashboard') return <PatientHome />
  if (view === 'reservar') {
    return (
      <PageState
        variant="empty"
        title="Reservar cita"
        description="Usa el asistente IA o contacta con tu clínica para reservar."
        action={
          <a
            href="/citas-con-ia"
            className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir al asistente
          </a>
        }
      />
    )
  }
  if (view === 'gestion-clinica') {
    return (
      <PageState
        variant="empty"
        title="Gestión clínica"
        description="Accede al panel de administración de tu clínica."
        action={
          <a
            href="/admin"
            className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir al panel clínica
          </a>
        }
      />
    )
  }
  const apiMap: Partial<Record<PatientView, string>> = {
    citas: '/api/patient-appointments/list',
    informes: '/api/patient/reports',
    documentos: '/api/patient/documents',
    facturas: '/api/patient/invoices',
    pagos: '/api/patient/payments',
    mensajes: '/api/patient/messages'
  }
  const endpoint = apiMap[view]
  if (endpoint) {
    return <AdminGenericModuleView title={titles[view]} description={descriptions[view]} endpoint={endpoint} />
  }
  return (
    <PageState
      variant="empty"
      title={titles[view]}
      description={descriptions[view] ?? 'Contenido del módulo en preparación.'}
    />
  )
}

function PatientInner({ view }: { view: PatientView }) {
  const logout = useLogout()
  const [staff, setStaff] = useState(false)
  const [patientName, setPatientName] = useState('Paciente')

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        const json = (await res.json()) as { data?: { role?: string; name?: string; email?: string } }
        if (res.ok) {
          if (json.data?.role === 'admin' || json.data?.role === 'super_admin') setStaff(true)
          if (json.data?.name) setPatientName(json.data.name)
          else if (json.data?.email) setPatientName(json.data.email.split('@')[0] ?? 'Paciente')
        }
      })
      .catch(() => undefined)
  }, [])

  const fullNav = useMemo(() => {
    const items = [...baseNav]
    if (staff) {
      items.unshift({
        href: '/paciente/gestion-clinica',
        label: 'Gestión clínica',
        icon: Stethoscope,
        view: 'gestion-clinica' as const
      })
    }
    return items
  }, [staff])

  const shellNav = useMemo(
    () => fullNav.map(({ href, label, icon }) => ({ href, label, icon })),
    [fullNav]
  )

  const navGroups = useMemo(() => buildPatientNavGroups(fullNav), [fullNav])

  return (
    <PortalShell
      brand="Portal paciente"
      subtitle="Tu salud dental"
      nav={shellNav}
      navGroups={navGroups}
      pageTitle={titles[view]}
      breadcrumbRoot={{ label: 'Paciente', href: '/paciente' }}
      sidebarStorageKey="ac_patient_sidebar_collapsed"
      userLabel={patientName}
      onLogout={logout}
      searchPlaceholder="Buscar citas, informes, facturas…"
    >
      <ShellPageHeader title={titles[view]} description={descriptions[view]} />
      <div className="pf-animate-in p-4 sm:p-6">
        <Body view={view} />
      </div>
    </PortalShell>
  )
}

export const PatientApp = ({ view = 'dashboard' }: { view?: PatientView }) => (
  <PatientPortalGate>
    <PasswordChangeGate>
      <DemoStoreProvider>
        <NoticeProvider>
          <PatientInner view={view} />
        </NoticeProvider>
      </DemoStoreProvider>
    </PasswordChangeGate>
  </PatientPortalGate>
)
