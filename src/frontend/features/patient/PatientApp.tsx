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
import { Container, PageHeader, Card, PageState } from '@/frontend/ds'
import { useDemoStore } from '@/hooks/useDemoStore'
import { AdminGenericModuleView } from '@/frontend/features/admin/views/AdminGenericModuleView'

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

const nav = [
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
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="font-semibold text-ink">Próximas citas</h2>
        {upcoming.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span>{a.treatment}</span>
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
      <Card>
        <h2 className="font-semibold text-ink">Acciones rápidas</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/paciente/reservar" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
            Reservar
          </a>
          <a href="/citas-con-ia" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
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
          <a href="/citas-con-ia" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Ir al asistente
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
    return <AdminGenericModuleView title={titles[view]} endpoint={endpoint} />
  }
  return <PageState variant="empty" title={titles[view]} description="Contenido del módulo en preparación." />
}

function PatientInner({ view }: { view: PatientView }) {
  const logout = useLogout()
  const [staff, setStaff] = useState(false)

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        const json = (await res.json()) as { data?: { role?: string } }
        if (res.ok && (json.data?.role === 'admin' || json.data?.role === 'super_admin')) {
          setStaff(true)
        }
      })
      .catch(() => undefined)
  }, [])

  const shellNav = useMemo(() => {
    const items = nav.map(({ href, label, icon }) => ({ href, label, icon }))
    if (staff) {
      items.unshift({
        href: '/paciente/gestion-clinica',
        label: 'Gestión clínica',
        icon: Stethoscope
      })
    }
    return items
  }, [staff])

  return (
    <PortalShell brand="Portal paciente" subtitle="Tu salud dental" nav={shellNav} onLogout={logout}>
      <Container size="full" className="!px-0">
        <PageHeader title={titles[view]} />
        <Body view={view} />
      </Container>
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
