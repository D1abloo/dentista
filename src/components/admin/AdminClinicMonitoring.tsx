import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Download, Eye, Search } from 'lucide-react';
import { AuditEventDetailPanel } from '@/components/shared/audit/AuditEventDetailPanel';
import { Badge, Button, Card, Empty, Field, PageHeader } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { canViewPdpAudit } from '@/lib/adminNav';
import type { AuditEventRow, AuditPayload } from '@/lib/platform/auditDemo';
import { MONITORING_SPEC_SECTIONS } from '@/lib/audit/monitoringSpec';
import { installClientErrorMonitoring } from '@/lib/audit/clientLog';

type Tab = 'activity' | 'spec';

async function fetchActivity(q: string): Promise<AuditPayload> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await fetch(`/api/admin/activity${qs}`, { credentials: 'include' });
  const json = (await res.json()) as { data?: AuditPayload; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar actividad');
  return json.data as AuditPayload;
}

export function AdminClinicMonitoring() {
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const [tab, setTab] = useState<Tab>('activity');
  const [payload, setPayload] = useState<AuditPayload | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditEventRow | null>(null);
  const denied = !staffLoading && !canViewPdpAudit(staff?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivity(search.trim());
      setPayload(data);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, [search, setNotice]);

  useEffect(() => {
    installClientErrorMonitoring();
    void load();
  }, [load]);

  const events = useMemo(() => payload?.events ?? [], [payload]);

  if (denied) {
    return (
      <Card>
        <PageHeader title="Acceso restringido" subtitle="Solo administración de clínica" />
        <p className="text-sm text-slate-600">La monitorización de actividad no está disponible para tu rol.</p>
      </Card>
    );
  }

  return (
    <div className={`grid gap-4${selected && tab === 'activity' ? ' adm-monitor--panel-open' : ''}`}>
      <Card>
        <PageHeader
          title="Monitorización y registros"
          subtitle="Actividad de tu clínica: logins, descargas, cambios y eventos de seguridad (sin datos clínicos completos)."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold${tab === 'activity' ? ' bg-[var(--blue)] text-white' : ' bg-slate-100 text-slate-700'}`}
            onClick={() => setTab('activity')}
          >
            <Activity className="mr-1 inline h-4 w-4" aria-hidden />
            Actividad de la clínica
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold${tab === 'spec' ? ' bg-[var(--blue)] text-white' : ' bg-slate-100 text-slate-700'}`}
            onClick={() => setTab('spec')}
          >
            <BookOpen className="mr-1 inline h-4 w-4" aria-hidden />
            Especificación del sistema
          </button>
        </div>

        {tab === 'spec' ? (
          <div className="adm-spec prose prose-sm max-w-none text-slate-700">
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              Referencia funcional del sistema de logs y auditoría de Dentista+. Los eventos reales se registran en
              Supabase (<code>audit_logs</code>, <code>login_events</code>) y son consultables en Plataforma (Super Admin)
              y aquí (solo tu clínica).
            </p>
            {MONITORING_SPEC_SECTIONS.map((section) => (
              <section key={section.title} className="mt-6">
                <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Eventos hoy</p>
                <p className="text-2xl font-bold">{payload?.kpis.events_today ?? payload?.kpis.audited ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Logins correctos</p>
                <p className="text-2xl font-bold">{payload?.kpis.logins_ok ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Accesos denegados</p>
                <p className="text-2xl font-bold text-amber-700">{payload?.kpis.access_denied ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Seguridad</p>
                <p className="text-2xl font-bold text-red-700">{payload?.kpis.security_events ?? '—'}</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field label="Buscar" className="min-w-[220px] flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                    placeholder="Usuario, evento, IP…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void load()}
                  />
                </div>
              </Field>
              <Button type="button" onClick={() => void load()}>
                Filtrar
              </Button>
              <Button
                type="button"
                tone="secondary"
                onClick={async () => {
                  await fetch('/api/admin/activity', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ action: 'log_export', format: 'csv' })
                  });
                  setNotice({ type: 'ok', message: 'Exportación registrada en auditoría.' });
                }}
              >
                <Download className="h-4 w-4" aria-hidden />
                Exportar (registrar)
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Cargando registros…</p>
            ) : !events.length ? (
              <Empty title="Sin eventos" text="La actividad de tu clínica aparecerá aquí tras logins y acciones en el panel." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Evento</th>
                      <th className="p-3">Módulo</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Severidad</th>
                      <th className="p-3">Resultado</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="p-3 whitespace-nowrap">{row.date_label}</td>
                        <td className="p-3">{row.action}</td>
                        <td className="p-3">{row.module}</td>
                        <td className="p-3">{row.actor_name}</td>
                        <td className="p-3">
                          <Badge
                            status={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'neutral'}
                            label={row.risk_label}
                          />
                        </td>
                        <td className="p-3">{row.result_label}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="text-[var(--blue)]"
                            onClick={() => setSelected(row)}
                            aria-label="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      {selected && tab === 'activity' ? (
        <AuditEventDetailPanel
          event={selected}
          title="Detalle del evento"
          onClose={() => setSelected(null)}
          actions={{
            onMarkReviewed: async () => {
              await fetch('/api/admin/activity', {
                method: 'POST',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ action: 'mark_reviewed', id: selected.id })
              });
              setNotice({ type: 'ok', message: 'Marcado como revisado.' });
              setSelected(null);
              void load();
            }
          }}
        />
      ) : null}
    </div>
  );
}
