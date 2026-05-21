import { DemoStoreProvider } from '@/hooks/useDemoStore';
import { NoticeProvider } from '@/hooks/useNotice';
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate';
import { RoleGate } from '@/components/auth/RoleGate';
import { Toast } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import type { AdminView } from './nav';
import { adminSubtitles, adminTitles } from './nav';
import { AdminShell } from './AdminShell';
import {
  AdminAgenda,
  AdminAppointments,
  AdminClinicalReports,
  AdminClinics,
  AdminConfig,
  AdminDashboard,
  AdminDentists,
  AdminDocuments,
  AdminInvoices,
  AdminNormativa,
  AdminPatientDetail,
  AdminPatients,
  AdminPayments,
  AdminReports,
  AdminTreatments
} from './views';
import { AdminConsents } from './consents';
import { AdminPortalAccess } from './portalAccess';
import { AdminGuide } from './AdminGuide';

function Body({ view, patientId }: { view: AdminView; patientId?: string }) {
  if (patientId && view === 'pacientes') {
    return <AdminPatientDetail patientId={patientId} />;
  }
  switch (view) {
    case 'agenda':
      return <AdminAgenda />;
    case 'citas':
      return <AdminAppointments />;
    case 'pacientes':
      return <AdminPatients />;
    case 'informes':
      return <AdminClinicalReports />;
    case 'documentos':
      return <AdminDocuments />;
    case 'facturas':
      return <AdminInvoices />;
    case 'pagos':
      return <AdminPayments />;
    case 'dentistas':
      return <AdminDentists />;
    case 'tratamientos':
      return <AdminTreatments />;
    case 'clinicas':
      return <AdminClinics />;
    case 'reportes':
      return <AdminReports />;
    case 'normativa':
      return <AdminNormativa />;
    case 'configuracion':
      return <AdminConfig />;
    case 'acceso-portal':
      return <AdminPortalAccess />;
    case 'ayuda':
      return <AdminGuide />;
    case 'consentimientos':
      return <AdminConsents />;
    default:
      return <AdminDashboard />;
  }
}

function AdminInner({ view, patientId }: { view: AdminView; patientId?: string }) {
  const { notice, clear } = useNotice();
  const title = patientId && view === 'pacientes' ? `Ficha ${patientId}` : adminTitles[view];
  const subtitle = patientId && view === 'pacientes' ? undefined : adminSubtitles[view];
  return (
    <AdminShell title={title} subtitle={subtitle}>
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
