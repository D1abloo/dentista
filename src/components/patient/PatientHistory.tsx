import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  Eye,
  History,
  Lock,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import {
  buildVisitKpis,
  documentsLink,
  downloadVisitSummary,
  enrichPatientVisits,
  filterAndSortVisits,
  followUpBookingLink,
  invoiceLink,
  messagesWithVisitContext,
  paymentLink,
  reportLink,
  visibleCompletedVisitsForPatient,
  type HistoryChip,
  type PatientHistorySort,
  type PatientVisitView
} from '@/lib/patient/historyData';

const CHIPS: { id: HistoryChip; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: 'year', label: 'Este año' },
  { id: 'report', label: 'Con informe' },
  { id: 'invoice', label: 'Con factura' },
  { id: 'documents', label: 'Con documentos' },
  { id: 'treatment', label: 'Tratamientos' },
  { id: 'revision', label: 'Revisiones' }
];

const PAGE_SIZE = 5;

function KpiStat({
  label,
  value,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 650) : value;
  return (
    <article className="phis-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="phis-kpi__label">{label}</p>
      <p className="phis-kpi__value">{n}</p>
    </article>
  );
}

function tagClass(tone: PatientVisitView['relatedTags'][0]['tone']) {
  if (tone === 'teal') return 'phis-tag--teal';
  if (tone === 'blue') return 'phis-tag--blue';
  if (tone === 'purple') return 'phis-tag--purple';
  if (tone === 'amber') return 'phis-tag--amber';
  return 'phis-tag--slate';
}

export function PatientHistory() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<HistoryChip>('all');
  const [sort, setSort] = useState<PatientHistorySort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const baseVisits = useMemo(() => visibleCompletedVisitsForPatient(state, patient.id), [state, patient.id]);

  const views = useMemo(() => enrichPatientVisits(state, patient.id, baseVisits), [state, patient.id, baseVisits]);

  const kpis = useMemo(() => buildVisitKpis(state, patient.id, views), [state, patient.id, views]);

  const filtered = useMemo(() => filterAndSortVisits(views, { q, chip, sort }), [views, q, chip, sort]);

  const pageRows = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const selected = useMemo(
    () =>
      filtered.find((v) => v.appointment.id === selectedId) ??
      views.find((v) => v.appointment.id === selectedId) ??
      null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/historial',
        resourceLabel: 'Historial de visitas'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, chip, sort]);

  useEffect(() => {
    if (!selectedId && pageRows[0]) setSelectedId(pageRows[0].appointment.id);
    if (selectedId && !filtered.some((v) => v.appointment.id === selectedId) && pageRows[0]) {
      setSelectedId(pageRows[0].appointment.id);
    }
  }, [filtered, pageRows, selectedId]);

  const openDetail = useCallback(
    (v: PatientVisitView) => {
      setSelectedId(v.appointment.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/historial',
          resourceLabel: v.treatmentName,
          resourceId: v.appointment.id
        });
      }
    },
    [portalAccess.active]
  );

  function viewDetail(v: PatientVisitView, e?: React.MouseEvent) {
    e?.stopPropagation();
    openDetail(v);
  }

  function downloadSummary(v: PatientVisitView, e?: React.MouseEvent) {
    e?.stopPropagation();
    setDownloadingId(v.appointment.id);
    try {
      const ok = downloadVisitSummary(v);
      if (!ok) throw new Error('fail');
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/historial',
          resourceLabel: `Descarga resumen ${v.appointment.id}`,
          resourceId: v.appointment.id
        });
      }
      setNotice({ type: 'ok', message: 'Resumen descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el resumen.' });
    } finally {
      setDownloadingId(null);
    }
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <div className="phis-page">
      <header className="phis-header">
        <h2>Historial de visitas</h2>
        <p>Consulta tus visitas anteriores, tratamientos realizados, informes, documentos y facturas relacionadas.</p>
        <div className="phis-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Historial protegido</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Solo tú puedes consultar las visitas vinculadas a tu perfil.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="phis-kpis">
          <KpiStat label="Visitas realizadas" value={kpis.visitCount} delay={0} numeric />
          <KpiStat label="Última visita" value={kpis.lastVisit} delay={50} />
          <KpiStat label="Tratamientos completados" value={kpis.treatmentsCompleted} delay={100} numeric />
          <KpiStat label="Informes asociados" value={kpis.reportsCount} delay={150} numeric />
          <KpiStat label="Documentos asociados" value={kpis.documentsCount} delay={200} numeric />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="phis-toolbar">
          <label className="phis-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por tratamiento, clínica, fecha, profesional o diagnóstico…"
              aria-label="Buscar visitas"
            />
          </label>
          <div className="phis-toolbar__row">
            <div className="phis-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`phis-chip${chip === c.id ? ' phis-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="phis-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as PatientHistorySort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="phis-empty">
          <div
            className="prt-empty__icon mx-auto"
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              background: 'rgba(20,184,166,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <History className="h-8 w-8 text-teal-700" aria-hidden />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] mt-3 m-0">Aún no tienes visitas cerradas</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            Cuando completes una cita, aparecerá aquí con su tratamiento, informe, documentos y facturas relacionadas.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="/paciente/reservar" className="phis-btn phis-btn--primary no-underline">
              Reservar cita
            </a>
            <a href="/paciente/citas" className="phis-btn phis-btn--outline no-underline">
              Ver mis citas
            </a>
          </div>
        </section>
      ) : showNoResults ? (
        <section className="phis-empty">
          <p className="font-bold m-0">No tienes visitas cerradas</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o búsqueda.</p>
        </section>
      ) : (
        <div className="phis-layout">
          <div className="phis-timeline">
            <h3 className="phis-list-title">Visitas cerradas</h3>
            {pageRows.map((v, i) => (
              <article
                key={v.appointment.id}
                className={`phis-card${selectedId === v.appointment.id ? ' phis-card--active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
              >
                <div className="phis-card__date">
                  <span className="phis-card__date-day">{v.dateLabel}</span>
                  <span className="phis-card__date-meta">
                    {v.dayLabel} · {v.timeLabel}
                  </span>
                </div>
                <div className="phis-card__body">
                  <div className="phis-card__head">
                    <h4>{v.treatmentName}</h4>
                    <span className="phis-status phis-status--completed">{v.statusText}</span>
                  </div>
                  <p className="phis-card__meta">
                    {v.clinicName}
                    <br />
                    {v.dentistName}
                  </p>
                  {v.relatedTags.length ? (
                    <div className="phis-tags">
                      {v.relatedTags.map((t) => (
                        <span key={t.id} className={`phis-tag ${tagClass(t.tone)}`}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="phis-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="phis-btn phis-btn--outline" onClick={(e) => viewDetail(v, e)}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Ver detalle
                    </button>
                    {v.report ? (
                      <a href={reportLink(v.report.id)} className="phis-btn phis-btn--outline no-underline">
                        Ver informe
                      </a>
                    ) : null}
                    {v.hasDocuments ? (
                      <a href={documentsLink(v.appointment.id)} className="phis-btn phis-btn--outline no-underline">
                        Ver documentos
                      </a>
                    ) : null}
                    {v.invoice ? (
                      <a href={invoiceLink(v.invoice.id)} className="phis-btn phis-btn--outline no-underline">
                        Ver factura
                      </a>
                    ) : null}
                    {!v.invoice && !v.report ? (
                      <a href={followUpBookingLink(v)} className="phis-btn phis-btn--primary no-underline">
                        Reservar seguimiento
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}

            {hasMore ? (
              <button type="button" className="phis-btn phis-btn--outline w-full mt-2" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Cargar más visitas
              </button>
            ) : null}

            <div className="phis-privacy">
              <h4 className="text-sm font-extrabold m-0">Privacidad</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                El historial solo está disponible para tu usuario y no puede ser consultado por otros pacientes.
              </p>
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
              <div className="phis-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="phis-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle de visita</h3>
                  <button type="button" className="phis-btn phis-btn--outline lg:hidden" onClick={() => setSelectedId(null)} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-sm text-[var(--corp-navy)] m-0 mb-3 flex items-center gap-2 flex-wrap">
                  <Stethoscope className="h-4 w-4 text-teal-600" aria-hidden />
                  {selected.treatmentName}
                  <span className="phis-status phis-status--completed">{selected.statusText}</span>
                </p>
                <dl>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{selected.dateLabel}</dd>
                  </div>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Profesional</dt>
                    <dd>{selected.dentistName}</dd>
                  </div>
                  <div>
                    <dt>Tratamiento</dt>
                    <dd>{selected.treatmentName}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.statusText}</dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd>{selected.durationLabel}</dd>
                  </div>
                  <div>
                    <dt>Informe relacionado</dt>
                    <dd>
                      {selected.report ? (
                        <a href={reportLink(selected.report.id)}>{selected.report.title}</a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Documentos relacionados</dt>
                    <dd>
                      {selected.documents.length ? (
                        <a href={documentsLink(selected.appointment.id)}>{selected.documents[0]?.title}</a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Factura relacionada</dt>
                    <dd>
                      {selected.invoice ? (
                        <a href={invoiceLink(selected.invoice.id)}>{selected.invoice.displayId}</a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Pago relacionado</dt>
                    <dd>
                      {selected.payment ? (
                        <a href={paymentLink(selected.payment.id, selected.invoice?.id)}>
                          {selected.payment.displayId}
                        </a>
                      ) : (
                        'Sin pago registrado'
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="phis-reco">
                  <p className="m-0 text-xs text-slate-700">
                    <strong>Recomendaciones:</strong> {selected.recommendations}
                  </p>
                </div>
                <div className="phis-detail__actions">
                  <button
                    type="button"
                    className="phis-btn phis-btn--primary w-full"
                    disabled={downloadingId === selected.appointment.id}
                    onClick={() => downloadSummary(selected)}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {downloadingId === selected.appointment.id ? 'Descargando…' : 'Descargar resumen'}
                  </button>
                  {selected.report ? (
                    <a href={reportLink(selected.report.id)} className="phis-btn phis-btn--outline w-full no-underline">
                      Ver informe
                    </a>
                  ) : null}
                  {selected.hasDocuments ? (
                    <a href={documentsLink(selected.appointment.id)} className="phis-btn phis-btn--outline w-full no-underline">
                      Ver documentos
                    </a>
                  ) : null}
                  {selected.invoice ? (
                    <a href={invoiceLink(selected.invoice.id)} className="phis-btn phis-btn--outline w-full no-underline">
                      Ver factura
                    </a>
                  ) : null}
                  <a href={followUpBookingLink(selected)} className="phis-btn phis-btn--outline w-full no-underline">
                    <Calendar className="h-4 w-4" aria-hidden />
                    Reservar seguimiento
                  </a>
                  <a href={messagesWithVisitContext(selected)} className="phis-btn phis-btn--outline w-full no-underline">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Enviar mensaje a la clínica
                  </a>
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
