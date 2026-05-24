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
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DemoStoreProvider } from '@/hooks/useDemoStore';
import { NoticeProvider } from '@/hooks/useNotice';
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate';
import { PatientPortalGate } from '@/components/auth/PatientPortalGate';
import { Toast } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { PatientShell } from './PatientShell';
import { PatientPortalStatus } from './PatientPortalStatus';
import {
  PatientAppointments,
  PatientCompletedAppointments,
  PatientPastAppointments,
  PatientBook,
  PatientDashboard,
  PatientDocuments,
  PatientHelp,
  PatientHistory,
  PatientInvoices,
  PatientMessages,
  PatientPayments,
  PatientProfile,
  PatientReports
} from './views';
import { PatientConsents } from './PatientConsents';
import { PatientStaffHub } from './PatientStaffHub';

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
  | 'gestion-clinica';

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
};

const nav = [
  { href: '/paciente', label: 'Inicio', icon: Home },
  { href: '/paciente/reservar', label: 'Reservar cita', icon: CalendarPlus },
  { href: '/paciente/citas', label: 'Mis citas', icon: Calendar },
  { href: '/paciente/citas-pasadas', label: 'Citas pasadas', icon: CalendarClock },
  { href: '/paciente/citas-completadas', label: 'Citas completadas', icon: CalendarCheck },
  { href: '/paciente/informes', label: 'Informes', icon: FileText },
  { href: '/paciente/documentos', label: 'Documentos', icon: FileStack },
  { href: '/paciente/facturas', label: 'Facturas', icon: Receipt },
  { href: '/paciente/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/paciente/historial', label: 'Historial', icon: History },
  { href: '/paciente/mensajes', label: 'Mensajes', icon: MessageSquare },
  { href: '/paciente/consentimientos', label: 'Consentimientos', icon: FileSignature },
  { href: '/paciente/perfil', label: 'Perfil', icon: User },
  { href: '/ayuda#portal-paciente', label: 'Ayuda', icon: HelpCircle }
];

function Body({ view }: { view: PatientView }) {
  switch (view) {
    case 'reservar':
      return <PatientBook />;
    case 'citas':
      return <PatientAppointments />;
    case 'citas-pasadas':
      return <PatientPastAppointments />;
    case 'citas-completadas':
      return <PatientCompletedAppointments />;
    case 'historial':
      return <PatientHistory />;
    case 'informes':
      return <PatientReports />;
    case 'documentos':
      return <PatientDocuments />;
    case 'facturas':
      return <PatientInvoices />;
    case 'consentimientos':
      return <PatientConsents />;
    case 'perfil':
      return <PatientProfile />;
    case 'pagos':
      return <PatientPayments />;
    case 'mensajes':
      return <PatientMessages />;
    case 'ayuda':
      return <PatientHelp />;
    case 'gestion-clinica':
      return <PatientStaffHub />;
    default:
      return <PatientDashboard />;
  }
}

const staffNavItem = {
  href: '/paciente/gestion-clinica',
  label: 'Gestión clínica',
  icon: Stethoscope
} as const;

function PatientInner({ view }: { view: PatientView }) {
  const { notice, clear } = useNotice();
  const [clinicStaff, setClinicStaff] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        const json = (await res.json()) as { data?: { role?: string } };
        if (res.ok && (json.data?.role === 'admin' || json.data?.role === 'super_admin')) {
          setClinicStaff(true);
        }
      })
      .catch(() => undefined);
  }, []);

  const shellNav = useMemo(
    () => (clinicStaff ? [staffNavItem, ...nav] : nav),
    [clinicStaff]
  );

  return (
    <PatientShell title={titles[view]} nav={shellNav} clinicStaff={clinicStaff}>
      <Toast notice={notice} onClose={clear} />
      <PatientPortalStatus>
        <Body view={view} />
      </PatientPortalStatus>
    </PatientShell>
  );
}

export function PatientApp({ view = 'dashboard' }: { view?: PatientView }) {
  return (
    <PatientPortalGate>
      <PasswordChangeGate>
        <DemoStoreProvider>
          <NoticeProvider>
            <PatientInner view={view} />
          </NoticeProvider>
        </DemoStoreProvider>
      </PasswordChangeGate>
    </PatientPortalGate>
  );
}
