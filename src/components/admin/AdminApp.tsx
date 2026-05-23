import { lazy, Suspense, type ReactNode } from 'react';
import { DemoStoreProvider } from '@/hooks/useDemoStore';
import { NoticeProvider } from '@/hooks/useNotice';
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate';
import { RoleGate } from '@/components/auth/RoleGate';
import { Toast } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import type { AdminView } from './nav';
import { adminSubtitles, adminTitles } from './nav';
import { AdminShell } from './AdminShell';
import { AdminDashboardToolbar } from './AdminDashboardToolbar';
import {
  AdminAppointments,
  AdminClinicalReports,
  AdminClinics,
  AdminDentists,
  AdminProfessionalProfiles,
  AdminNormativa,
  AdminPatientDetail,
  AdminTreatments
} from './views';
import { AdminDashboard } from './AdminDashboard';
import { AdminPatients } from './AdminPatients';
import { AdminConsents } from './consents';
import { AdminClinicUsers } from './clinicUsers';
import { AdminPdpAudit } from './pdpAudit';
import { AdminPortalAccess } from './portalAccess';

const LazyAgenda = lazy(() => import('./AdminAgenda').then((m) => ({ default: m.AdminAgenda })));
const LazyDocuments = lazy(() => import('./AdminDocuments').then((m) => ({ default: m.AdminDocuments })));
const LazyInvoices = lazy(() => import('./AdminInvoices').then((m) => ({ default: m.AdminInvoices })));
const LazyPayments = lazy(() => import('./AdminPayments').then((m) => ({ default: m.AdminPayments })));
const LazyReports = lazy(() => import('./AdminReports').then((m) => ({ default: m.AdminReports })));
const LazyNotifications = lazy(() =>
  import('./AdminNotifications').then((m) => ({ default: m.AdminNotifications }))
);
const LazySettings = lazy(() => import('./AdminSettings').then((m) => ({ default: m.AdminSettings })));

function PanelFallback() {
  return (
    <p className="portal-panel-loading" role="status" aria-live="polite">
      Cargando módulo…
    </p>
  );
}

function LazyPanel({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PanelFallback />}>{children}</Suspense>;
}

function Body({ view, patientId }: { view: AdminView; patientId?: string }) {
  if (patientId && view === 'pacientes') {
    return <AdminPatientDetail patientId={patientId} />;
  }
  switch (view) {
    case 'agenda':
      return (
        <LazyPanel>
          <LazyAgenda />
        </LazyPanel>
      );
    case 'citas':
      return <AdminAppointments />;
    case 'pacientes':
      return <AdminPatients />;
    case 'informes':
      return <AdminClinicalReports />;
    case 'documentos':
      return (
        <LazyPanel>
          <LazyDocuments />
        </LazyPanel>
      );
    case 'facturas':
      return (
        <LazyPanel>
          <LazyInvoices />
        </LazyPanel>
      );
    case 'pagos':
      return (
        <LazyPanel>
          <LazyPayments />
        </LazyPanel>
      );
    case 'dentistas':
      return <AdminDentists />;
    case 'profesionales':
      return <AdminProfessionalProfiles />;
    case 'tratamientos':
      return <AdminTreatments />;
    case 'clinicas':
      return <AdminClinics />;
    case 'reportes':
      return (
        <LazyPanel>
          <LazyReports />
        </LazyPanel>
      );
    case 'normativa':
      return <AdminNormativa />;
    case 'notificaciones':
      return (
        <LazyPanel>
          <LazyNotifications />
        </LazyPanel>
      );
    case 'configuracion':
      return (
        <LazyPanel>
          <LazySettings />
        </LazyPanel>
      );
    case 'acceso-portal':
      return <AdminPortalAccess />;
    case 'auditoria-pdp':
      return <AdminPdpAudit />;
    case 'usuarios':
      return <AdminClinicUsers />;
    case 'consentimientos':
      return <AdminConsents />;
    default:
      return <AdminDashboard />;
  }
}

function AdminInner({ view, patientId }: { view: AdminView; patientId?: string }) {
  const { notice, clear } = useNotice();
  const isDashboard = view === 'dashboard' && !patientId;
  const isAgenda = view === 'agenda' && !patientId;
  const isPatients = view === 'pacientes' && !patientId;
  const isDocuments = view === 'documentos' && !patientId;
  const isInvoices = view === 'facturas' && !patientId;
  const isReports = view === 'reportes' && !patientId;
  const isPayments = view === 'pagos' && !patientId;
  const isNotifications = view === 'notificaciones' && !patientId;
  const isSettings = view === 'configuracion' && !patientId;
  const title = patientId && view === 'pacientes' ? `Ficha ${patientId}` : isDashboard ? 'Resumen general' : adminTitles[view];
  const subtitle = patientId && view === 'pacientes' ? undefined : adminSubtitles[view];
  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      compactNav
      agendaModule={isAgenda}
      patientsModule={isPatients}
      documentsModule={isDocuments}
      invoicesModule={isInvoices}
      paymentsModule={isPayments}
      reportsModule={isReports}
      notificationsModule={isNotifications}
      settingsModule={isSettings}
      dashboardToolbar={isDashboard ? <AdminDashboardToolbar /> : undefined}
    >
      <Toast notice={notice} onClose={clear} />
      <Body view={view} patientId={patientId} />
    </AdminShell>
  );
}

export function AdminApp({ view = 'dashboard', patientId }: { view?: AdminView; patientId?: string }) {
  return (
    <RoleGate role="admin">
      <PasswordChangeGate>
        <DemoStoreProvider>
          <NoticeProvider>
            <AdminInner view={view} patientId={patientId} />
          </NoticeProvider>
        </DemoStoreProvider>
      </PasswordChangeGate>
    </RoleGate>
  );
}
