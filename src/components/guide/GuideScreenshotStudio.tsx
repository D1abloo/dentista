import { useEffect, type ReactNode } from 'react';
import { demoSeed } from '@/data/demoData';
import { NoticeProvider } from '@/hooks/useNotice';
import { PatientAppointments, PatientDashboard, PatientInvoices, PatientReports } from '@/components/patient/views';
import { PatientDocuments, PatientPayments } from '@/components/patient/records';
import { AdminAgenda, AdminDashboard, AdminPatients } from '@/components/admin/views';
import { AdminInvoices } from '@/components/admin/uploadViews';
import { AdminPortalAccess } from '@/components/admin/portalAccess';
import { GuideDemoStoreProvider } from './GuideDemoStore';
import { STORAGE_PATIENT_ID, STORAGE_TENANT_ID } from '@/lib/storage/keys';
import { TENANT_CENTRO } from '@/lib/tenantIds';

const PATIENT_ID = 'PAT-0001';

function SeedStorage() {
  useEffect(() => {
    localStorage.setItem(STORAGE_PATIENT_ID, PATIENT_ID);
    localStorage.setItem(STORAGE_TENANT_ID, TENANT_CENTRO);
  }, []);
  return null;
}

const scenes: Record<string, { node: ReactNode }> = {
  'pdp-inicio': { node: <PatientDashboard /> },
  'pdp-citas': { node: <PatientAppointments /> },
  'pdp-informes': { node: <PatientReports /> },
  'pdp-documentos': { node: <PatientDocuments /> },
  'pdp-facturas': { node: <PatientInvoices /> },
  'pdp-pagos': { node: <PatientPayments /> },
  'admin-dashboard': { node: <AdminDashboard /> },
  'admin-agenda': { node: <AdminAgenda /> },
  'admin-pacientes': { node: <AdminPatients /> },
  'admin-facturas': { node: <AdminInvoices /> },
  'admin-acceso': { node: <AdminPortalAccess /> }
};

/** Contenido interior del marco móvil (el marco HTML está en guia-capturas.astro). */
export function GuideScreenshotStudio({ scene }: { scene: string }) {
  const entry = scenes[scene] ?? scenes['pdp-inicio'];
  const portalClass =
    scene.startsWith('admin') ? 'portal portal--admin guide-shot-portal' : 'portal portal--patient guide-shot-portal';

  return (
    <GuideDemoStoreProvider initialState={demoSeed}>
      <NoticeProvider>
        <SeedStorage />
        <div className={portalClass}>
          <main className="guide-shot-body portal-body portal-body--admin">{entry.node}</main>
        </div>
      </NoticeProvider>
    </GuideDemoStoreProvider>
  );
}
