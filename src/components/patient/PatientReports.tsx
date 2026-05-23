import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  FileText,
  Lock,
  Search,
  Shield,
  Sparkles
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { resolveFocusId, usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import { visibleReportsForPatient } from '@/lib/selectors';
import {
  buildReportKpis,
  enrichPatientReports,
  filterAndSortReports,
  markPatientReportRead,
  type ReportChip,
  type ReportSort,
  type PatientReportView
} from '@/lib/patient/reportsData';
import { PatientReportViewer } from './PatientReportViewer';

const CHIPS: { id: ReportChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'new', label: 'Nuevos' },
  { id: 'read', label: 'Leídos' },
  { id: 'unread', label: 'No leídos' },
  { id: 'pdf', label: 'Con PDF' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: 'clinic', label: 'Por clínica' }
];

function KpiStat({ label, value, delay, numeric }: { label: string; value: string | number; delay: number; numeric?: boolean }) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 650) : value;
  return (
    <article className="prt-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="prt-kpi__label">{label}</p>
      <p className="prt-kpi__value">{n}</p>
    </article>
  );
}

export function PatientReports() {
  const { state, dataSource } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<ReportChip>('all');
  const [sort, setSort] = useState<ReportSort>('recent');
  const [clinicFilter, setClinicFilter] = useState('');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [readVersion, setReadVersion] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const urlParams = usePatientUrlParams();
  const focusId = resolveFocusId(urlParams, ['focus', 'informe', 'report']);

  const baseReports = useMemo(() => visibleReportsForPatient(state, patient.id), [state, patient.id]);

  const views = useMemo(
    () => enrichPatientReports(state, patient.id, baseReports),
    [state, patient.id, baseReports, readVersion]
  );

  const kpis = useMemo(() => buildReportKpis(views), [views]);

  const clinics = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of views) {
      if (v.clinicId) map.set(v.clinicId, v.clinicName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [views]);

  const filtered = useMemo(
    () => filterAndSortReports(views, { q, chip, clinicId: chip === 'clinic' ? clinicFilter : '', sort }),
    [views, q, chip, clinicFilter, sort]
  );

  const viewerReport = useMemo(
    () => views.find((v) => v.report.id === viewerId) ?? null,
    [views, viewerId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'view_report',
        pagePath: '/paciente/informes',
        resourceLabel: 'Listado de informes clínicos'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => {
    if (focusId) {
      const match = views.find((v) => v.report.id === focusId);
      if (match) setViewerId(match.report.id);
    }
  }, [focusId, views]);

  const openViewer = useCallback(
    (v: PatientReportView) => {
      setViewerId(v.report.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_report',
          pagePath: '/paciente/informes',
          resourceLabel: v.report.title,
          resourceId: v.report.id
        });
      }
    },
    [portalAccess.active]
  );

  async function downloadPdf(v: PatientReportView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!v.hasPdf || !v.report.fileRef) {
      setNotice({ type: 'error', message: 'No se pudo descargar el informe.' });
      return;
    }
    setDownloadingId(v.report.id);
    try {
      const ok = downloadDemoFileRef(v.report.fileRef, v.report.fileName ?? `${v.report.id}.pdf`);
      if (!ok) throw new Error('download failed');
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_report',
          pagePath: '/paciente/informes',
          resourceLabel: `Descarga ${v.report.title}`,
          resourceId: v.report.id
        });
      }
      setNotice({ type: 'ok', message: 'Informe descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el informe.' });
    } finally {
      setDownloadingId(null);
    }
  }

  function markRead(v: PatientReportView, e?: React.MouseEvent) {
    e?.stopPropagation();
    markPatientReportRead(patient.id, v.report.id);
    setReadVersion((n) => n + 1);
    setNotice({ type: 'ok', message: 'Informe marcado como leído.' });
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  if (dataSource === 'empty') {
    return (
      <div className="prt-page">
        <p className="banner-alert">No se pudieron cargar tus informes.</p>
      </div>
    );
  }

  return (
    <div className="prt-page">
      <header className="prt-header">
        <h2>Mis informes</h2>
        <p>Consulta informes clínicos publicados por tu clínica y descarga los documentos disponibles.</p>
        <div className="prt-security">
          <div className="prt-security__text">
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong>Informes seguros</strong>
            <span>Solo tú puedes ver los informes vinculados a tu perfil.</span>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="prt-kpis">
          <KpiStat label="Informes disponibles" value={kpis.available} delay={0} numeric />
          <KpiStat label="Informes nuevos" value={kpis.newCount} delay={70} numeric />
          <KpiStat label="Último informe" value={kpis.lastDate} delay={140} />
          <KpiStat label="Clínicas vinculadas" value={kpis.clinicCount} delay={210} numeric />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="prt-toolbar">
          <label className="prt-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, diagnóstico, clínica, fecha o profesional…"
              aria-label="Buscar informes"
            />
          </label>
          <div className="prt-toolbar__row">
            <div className="prt-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`prt-chip${chip === c.id ? ' prt-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="prt-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as ReportSort)} aria-label="Ordenar informes">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
                <option value="title">Ordenar por: título A-Z</option>
              </select>
            </div>
          </div>
          {chip === 'clinic' && clinics.length > 1 ? (
            <select
              className="prt-sort"
              value={clinicFilter}
              onChange={(e) => setClinicFilter(e.target.value)}
              aria-label="Filtrar por clínica"
            >
              <option value="">Todas las clínicas</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}

      {showEmpty ? (
        <section className="prt-empty">
          <div className="prt-empty__icon" aria-hidden>
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] m-0">Aún no tienes informes disponibles</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            Cuando tu clínica publique un informe clínico para ti, podrás consultarlo y descargarlo desde esta sección.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="/paciente/reservar" className="prt-btn prt-btn--primary no-underline">
              Reservar cita
            </a>
            <a href="/paciente/mensajes" className="prt-btn prt-btn--outline no-underline">
              Contactar clínica
            </a>
          </div>
        </section>
      ) : showNoResults ? (
        <section className="prt-empty">
          <p className="font-bold text-slate-700 m-0">No tienes informes disponibles</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o términos de búsqueda.</p>
        </section>
      ) : (
        <div className="prt-list-wrap">
          <h3 className="prt-list-title">Informes clínicos</h3>
          <div className="prt-list">
            {filtered.map((v, i) => (
              <article
                key={v.report.id}
                className={`prt-card${viewerId === v.report.id ? ' prt-card--active' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="prt-card__head">
                  <h4>{v.report.title}</h4>
                  <span className={`prt-status ${v.isNew ? 'prt-status--new' : 'prt-status--read'}`}>
                    {v.isNew ? 'Nuevo' : 'Leído'}
                  </span>
                </div>
                <p className="prt-card__meta">
                  {v.clinicName} · {v.professional}
                  <br />
                  Publicado: {v.publishedLabel} · {v.typeLabel}
                </p>
                <p className="prt-card__preview">{v.summary}</p>
                <div className="prt-card__actions">
                  <button type="button" className="prt-btn prt-btn--primary" onClick={() => openViewer(v)}>
                    Ver informe
                  </button>
                  {v.hasPdf ? (
                    <button
                      type="button"
                      className="prt-btn prt-btn--outline"
                      disabled={downloadingId === v.report.id}
                      onClick={(e) => void downloadPdf(v, e)}
                    >
                      {downloadingId === v.report.id ? 'Descargando…' : 'Descargar PDF'}
                    </button>
                  ) : null}
                  {v.isNew ? (
                    <button type="button" className="prt-btn prt-btn--outline" onClick={(e) => markRead(v, e)}>
                      <Check className="h-3 w-3" aria-hidden />
                      Marcar leído
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="prt-privacy">
            <h4>Privacidad</h4>
            <p>Los informes solo están disponibles para tu usuario y no pueden ser consultados por otros pacientes.</p>
            <div className="prt-privacy-badges">
              <span>
                <Shield className="h-3 w-3" aria-hidden />
                Datos privados
              </span>
              <span>
                <Lock className="h-3 w-3" aria-hidden />
                Portal seguro
              </span>
              <span>
                <Sparkles className="h-3 w-3" aria-hidden />
                Acceso personal
              </span>
            </div>
          </div>
        </div>
      )}

      {viewerReport ? (
        <PatientReportViewer
          view={viewerReport}
          tenantId={viewerReport.report.tenantId}
          downloading={downloadingId === viewerReport.report.id}
          onClose={() => setViewerId(null)}
          onDownload={() => void downloadPdf(viewerReport)}
          onMarkRead={() => markRead(viewerReport)}
        />
      ) : null}
    </div>
  );
}
