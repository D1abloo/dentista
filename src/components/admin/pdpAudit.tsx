import { useEffect, useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { canViewPdpAudit } from '@/lib/adminNav';
import { exportCsv } from '@/lib/demoStore';
import { portalAuditEventLabel } from '@/lib/portalAccessLabels';

type AuditRow = {
  id: string;
  event_type: string;
  page_path: string | null;
  resource_label: string | null;
  resource_id: string | null;
  staff_profile_id: string | null;
  staff_name?: string;
  patient_name?: string;
  created_at: string;
};

type StaffOption = { id: string; full_name: string; email: string; role: string };

export function AdminPdpAudit() {
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<StaffOption[]>([]);
  const [staffFilter, setStaffFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const denied = !staffLoading && !canViewPdpAudit(staff?.role);

  async function load(filter = staffFilter) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ audit: '1' });
      if (filter) qs.set('staffProfileId', filter);
      const res = await fetch(`/api/admin/portal-access?${qs}`, { credentials: 'include' });
      const json = (await res.json()) as {
        data?: { audit?: AuditRow[]; staffProfiles?: StaffOption[] };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar');
      setAudit(json.data?.audit ?? []);
      if (json.data?.staffProfiles?.length) setStaffProfiles(json.data.staffProfiles);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const exportRows = useMemo(
    () =>
      audit.map((row) => ({
        fecha: new Date(row.created_at).toLocaleString('es-ES'),
        profesional: row.staff_name ?? '—',
        evento: portalAuditEventLabel(row.event_type),
        detalle: row.resource_label || row.page_path || '—',
        recurso_id: row.resource_id ?? '',
        paciente: row.patient_name ?? '—'
      })),
    [audit]
  );

  function exportExcel() {
    if (!exportRows.length) {
      setNotice({ type: 'error', message: 'No hay registros para exportar.' });
      return;
    }
    const suffix = staffFilter ? `-${staffFilter.slice(0, 8)}` : '';
    exportCsv(exportRows, `auditoria-pdp${suffix}.csv`);
    setNotice({ type: 'ok', message: 'Exportación lista (abre el CSV en Excel).' });
  }

  if (denied) {
    return (
      <Card>
        <PageHeader title="Acceso restringido" subtitle="Solo administración de clínica" />
        <p className="text-sm text-slate-600">La auditoría del portal del paciente no está disponible para tu rol.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <PageHeader
          title="Registro de actividad en portal paciente"
          subtitle="Solo visible en administración. Los pacientes no ven este historial."
        />
        <p className="mb-4 text-sm text-slate-600">
          Aquí se registran las acciones del personal cuando entra al portal del paciente con token o acceso
          autorizado. Filtra por profesional y exporta para auditoría interna.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Profesional">
            <Select
              className="field-control min-w-[14rem]"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="">Todos los profesionales</option>
              <option value="me">Mis acciones</option>
              {staffProfiles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
            </Select>
          </Field>
          <Button tone="secondary" onClick={() => void load(staffFilter)}>
            <Filter className="h-4 w-4" /> Aplicar filtro
          </Button>
          <Button tone="secondary" onClick={() => exportExcel()} disabled={!audit.length}>
            <Download className="h-4 w-4" /> Exportar Excel (CSV)
          </Button>
        </div>
      </Card>

      <Card title={loading ? 'Cargando…' : `${audit.length} registros`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Fecha / hora</th>
                <th>Profesional</th>
                <th>Evento</th>
                <th>Detalle</th>
                <th>Paciente</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap">{new Date(row.created_at).toLocaleString('es-ES')}</td>
                  <td>{row.staff_name ?? '—'}</td>
                  <td>
                    <Badge status="info" label={portalAuditEventLabel(row.event_type)} />
                  </td>
                  <td>
                    {row.resource_label || row.page_path || '—'}
                    {row.resource_id ? ` · ${row.resource_id}` : ''}
                  </td>
                  <td>{row.patient_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !audit.length ? (
          <Empty title="Sin registros" text="Genera un token en Acceso PdP y entra al portal para ver actividad aquí." />
        ) : null}
      </Card>
    </div>
  );
}
