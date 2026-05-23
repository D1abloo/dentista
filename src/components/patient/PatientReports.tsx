import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  FileText,
  Lock,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  X
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
  messagesWithReportContext,
  relatedDocumentsQuery,
  type ReportChip,
  type ReportSort,
  type PatientReportView
} from '@/lib/patient/reportsData';

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
  const { state } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<ReportChip>('all');
  const [sort, setSort] = useState<ReportSort>('recent');
  const [clinicFilter, setClinicFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = useMemo(
    () => filtered.find((v) => v.report.id === selectedId) ?? views.find((v) => v.report.id === selectedId) ?? null,
    [filtered, views, selectedId]
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
      if (match) {
        setSelectedId(match.report.id);
        return;
      }
    }
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].report.id);
    if (selectedId && !filtered.some((v) => v.report.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].report.id);
    }
  }, [filtered, selectedId, focusId, views]);

  const openDetail = useCallback((v: PatientReportView) => {
    setSelectedId(v.report.id);
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'view_report',
        pagePath: '/paciente/informes',
        resourceLabel: v.report.title,
        resourceId: v.report.id
      });
    }
  }, [portalAccess.active]);

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
        <div className={`prt-layout${selected ? ' prt-layout--open' : ''}`}>
          <div>
            <h3 className="prt-list-title">Informes clínicos</h3>
            {filtered.map((v, i) => (
              <article
                key={v.report.id}
                className={`prt-card${selectedId === v.report.id ? ' prt-card--active' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
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
                  Publicado: {v.publishedLabel} · Tipo: {v.typeLabel}
                </p>
                <div className="prt-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="prt-btn prt-btn--primary" onClick={() => openDetail(v)}>
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
                      Marcar como leído
                    </button>
                  ) : null}
                </div>
              </article>
            ))}

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

          {selected ? (
            <>
              <div className="prt-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="prt-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle del informe</h3>
                  <button type="button" className="prt-btn prt-btn--outline lg:hidden" onClick={() => setSelectedId(null)} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-[var(--corp-navy)] text-sm m-0 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" aria-hidden />
                  {selected.report.title}
                  <span className={`prt-status ${selected.isNew ? 'prt-status--new' : 'prt-status--read'}`}>
                    {selected.isNew ? 'Nuevo' : 'Leído'}
                  </span>
                </p>
                <dl>
                  <div>
                    <dt>Título</dt>
                    <dd>{selected.report.title}</dd>
                  </div>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Profesional</dt>
                    <dd>{selected.professional}</dd>
                  </div>
                  <div>
                    <dt>Fecha de publicación</dt>
                    <dd>{selected.publishedLabel}</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>{selected.typeLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.isNew ? 'Nuevo' : 'Leído'}</dd>
                  </div>
                </dl>
                <div className="prt-block">
                  <h5>Resumen</h5>
                  <p>{selected.summary}</p>
                </div>
                {selected.report.recommendations ? (
                  <div className="prt-block">
                    <h5>Recomendaciones</h5>
                    <p>{selected.report.recommendations}</p>
                  </div>
                ) : null}
                {selected.hasPdf ? (
                  <div className="prt-block">
                    <h5>Documentos adjuntos</h5>
                    <div className="prt-attach">
                      <FileText className="h-5 w-5 text-teal-700" aria-hidden />
                      <div>
                        <p className="m-0 text-xs font-bold">{selected.report.fileName ?? 'Informe PDF'}</p>
                        <p className="m-0 text-[0.65rem] text-slate-500">{selected.fileSizeLabel}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="prt-detail__actions">
                  {selected.hasPdf ? (
                    <button
                      type="button"
                      className="prt-btn prt-btn--primary w-full"
                      disabled={downloadingId === selected.report.id}
                      onClick={() => void downloadPdf(selected)}
                    >
                      {downloadingId === selected.report.id ? 'Descargando…' : 'Descargar PDF'}
                    </button>
                  ) : null}
                  <a
                    href={relatedDocumentsQuery(selected.report.id, selected.report.appointmentId)}
                    className="prt-btn prt-btn--outline w-full no-underline"
                  >
                    Ver documentos relacionados
                  </a>
                  <a
                    href={messagesWithReportContext(selected.report.title)}
                    className="prt-btn prt-btn--outline w-full no-underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    Enviar mensaje a la clínica
                  </a>
                  {selected.isNew ? (
                    <button type="button" className="prt-btn prt-btn--outline w-full" onClick={() => markRead(selected)}>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Marcar como leído
                    </button>
                  ) : null}
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
