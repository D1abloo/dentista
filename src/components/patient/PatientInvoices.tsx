import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Download,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  Receipt,
  Search,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { createPayment } from '@/lib/demoStore';
import { openDemoFilePreview, resolveDemoFileUrl } from '@/lib/demoFiles';
import { money } from '@/lib/format';
import { resolveFocusId, usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import {
  buildInvoiceKpis,
  downloadPatientInvoicePdf,
  enrichPatientInvoices,
  filterAndSortInvoices,
  messagesWithInvoiceContext,
  paymentsLinkForInvoice,
  visibleInvoicesForPatient,
  type InvoiceChip,
  type PatientInvoiceSort,
  type PatientInvoiceView
} from '@/lib/patient/invoicesData';

const CHIPS: { id: InvoiceChip; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'pagada', label: 'Pagadas' },
  { id: 'vencida', label: 'Vencidas' },
  { id: 'pdf', label: 'Con PDF' },
  { id: '30d', label: 'Últimos 30 días' }
];

function statusClass(status: PatientInvoiceView['effectiveStatus']) {
  if (status === 'pagada') return 'pinv-status--paid';
  if (status === 'vencida') return 'pinv-status--overdue';
  return 'pinv-status--pending';
}

const PAGE_SIZE = 10;

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
    <article className="pinv-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="pinv-kpi__label">{label}</p>
      <p className="pinv-kpi__value">{n}</p>
    </article>
  );
}

export function PatientInvoices() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<InvoiceChip>('all');
  const [sort, setSort] = useState<PatientInvoiceSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const urlParams = usePatientUrlParams();
  const urlInvoice = useMemo(() => {
    const filtro = urlParams.get('filtro') ?? '';
    const chipMap: Record<string, InvoiceChip> = {
      pendiente: 'pendiente',
      pagada: 'pagada',
      vencida: 'vencida'
    };
    return {
      factura: resolveFocusId(urlParams, ['factura', 'invoice', 'focus']),
      filtro: chipMap[filtro] ?? ('' as InvoiceChip | '')
    };
  }, [urlParams]);

  useEffect(() => {
    if (urlInvoice.filtro) setChip(urlInvoice.filtro);
  }, [urlInvoice.filtro]);

  const baseInvoices = useMemo(() => visibleInvoicesForPatient(state, patient.id), [state, patient.id]);

  const views = useMemo(
    () => enrichPatientInvoices(state, patient.id, baseInvoices, resolveDemoFileUrl),
    [state, patient.id, baseInvoices]
  );

  const kpis = useMemo(() => buildInvoiceKpis(state, patient.id, views), [state, patient.id, views]);

  const filtered = useMemo(() => filterAndSortInvoices(views, { q, chip, sort }), [views, q, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = useMemo(
    () => filtered.find((v) => v.invoice.id === selectedId) ?? views.find((v) => v.invoice.id === selectedId) ?? null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'view_invoice',
        pagePath: '/paciente/facturas',
        resourceLabel: 'Listado de facturas'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => {
    setPage(1);
  }, [q, chip, sort]);

  useEffect(() => {
    if (urlInvoice.factura) {
      const match = views.find((v) => v.invoice.id === urlInvoice.factura || v.displayId === urlInvoice.factura);
      if (match) setSelectedId(match.invoice.id);
      return;
    }
    if (!selectedId && pageRows[0]) setSelectedId(pageRows[0].invoice.id);
    if (selectedId && !filtered.some((v) => v.invoice.id === selectedId) && pageRows[0]) {
      setSelectedId(pageRows[0].invoice.id);
    }
  }, [filtered, pageRows, selectedId, urlInvoice.factura, views]);

  const openDetail = useCallback(
    (v: PatientInvoiceView) => {
      setSelectedId(v.invoice.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_invoice',
          pagePath: '/paciente/facturas',
          resourceLabel: v.displayId,
          resourceId: v.invoice.id
        });
      }
    },
    [portalAccess.active]
  );

  function viewInvoice(v: PatientInvoiceView, e?: React.MouseEvent) {
    e?.stopPropagation();
    openDetail(v);
    if (v.invoice.fileRef) openDemoFilePreview(v.invoice.fileRef);
    else setNotice({ type: 'error', message: 'No se pudo abrir la factura.' });
  }

  async function downloadInvoice(v: PatientInvoiceView, e?: React.MouseEvent) {
    e?.stopPropagation();
    setDownloadingId(v.invoice.id);
    try {
      const ok = await downloadPatientInvoicePdf(state, v.invoice);
      if (!ok) throw new Error('fail');
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_invoice',
          pagePath: '/paciente/facturas',
          resourceLabel: `Descarga ${v.displayId}`,
          resourceId: v.invoice.id
        });
      }
      setNotice({ type: 'ok', message: 'Factura descargada correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar la factura.' });
    } finally {
      setDownloadingId(null);
    }
  }

  async function payInvoice(v: PatientInvoiceView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (v.effectiveStatus === 'pagada') {
      setNotice({ type: 'error', message: 'Esta factura ya está pagada.' });
      return;
    }
    setPayingId(v.invoice.id);
    try {
      const res = await fetch('/api/billing/stripe-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId: patient.preferredClinicId ?? state.clinics.find((c) => c.tenantId === v.invoice.tenantId)?.id,
          patientId: patient.id,
          invoiceId: v.invoice.id,
          amount: v.invoice.amount,
          concept: v.invoice.concept
        })
      });
      const json = (await res.json()) as { data?: { checkoutUrl?: string }; error?: { message?: string } };
      if (res.ok && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
        return;
      }
      commit(
        createPayment(state, {
          patientId: patient.id,
          invoiceId: v.invoice.id,
          amount: v.invoice.amount,
          method: 'tarjeta',
          status: 'completado',
          paidAt: new Date().toISOString().slice(0, 10)
        })
      );
      setNotice({ type: 'ok', message: 'Pago registrado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo iniciar el pago. Inténtalo de nuevo.' });
    } finally {
      setPayingId(null);
    }
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <div className="pinv-page">
      <header className="pinv-header">
        <h2>Mis facturas</h2>
        <p>Consulta tus facturas, descarga PDFs y revisa el estado de tus pagos.</p>
        <div className="pinv-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Facturación segura</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Solo tú puedes consultar las facturas vinculadas a tu perfil.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="pinv-kpis">
          <KpiStat label="Facturas disponibles" value={kpis.available} delay={0} numeric />
          <KpiStat label="Pendiente de pago" value={money(kpis.pendingAmount)} delay={50} />
          <KpiStat label="Facturas pagadas" value={kpis.paidCount} delay={100} numeric />
          <KpiStat label="Última factura" value={kpis.lastInvoice} delay={150} />
          <KpiStat label="Pagos realizados" value={kpis.paymentsCount} delay={200} numeric />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="pinv-toolbar">
          <label className="pinv-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por número de factura, concepto, clínica, fecha o importe…"
              aria-label="Buscar facturas"
            />
          </label>
          <div className="pinv-toolbar__row">
            <div className="pinv-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`pinv-chip${chip === c.id ? ' pinv-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="pinv-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as PatientInvoiceSort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
                <option value="amount">Ordenar por: importe mayor</option>
                <option value="due">Ordenar por: vencimiento</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="pinv-empty">
          <div className="prt-empty__icon mx-auto" style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt className="h-8 w-8 text-teal-700" aria-hidden />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] mt-3 m-0">Aún no tienes facturas disponibles</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            Cuando tu clínica emita una factura, podrás consultarla, descargarla en PDF y revisar su estado de pago desde esta sección.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="/paciente/reservar" className="pinv-btn pinv-btn--primary no-underline">
              Reservar cita
            </a>
            <a href="/paciente/mensajes" className="pinv-btn pinv-btn--outline no-underline">
              Contactar clínica
            </a>
          </div>
        </section>
      ) : showNoResults ? (
        <section className="pinv-empty">
          <p className="font-bold m-0">No tienes facturas disponibles</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o búsqueda.</p>
        </section>
      ) : (
        <div className="pinv-layout">
          <div>
            <h3 className="pinv-list-title">Facturas emitidas</h3>
            {pageRows.map((v, i) => (
              <article
                key={v.invoice.id}
                className={`pinv-card${selectedId === v.invoice.id ? ' pinv-card--active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
              >
                <div className="pinv-card__head">
                  <h4>{v.displayId}</h4>
                  <span className={`pinv-status ${statusClass(v.effectiveStatus)}`}>{v.statusText}</span>
                </div>
                <p className="pinv-card__concept">{v.concept}</p>
                <p className="pinv-card__meta">
                  {v.clinicName}
                  <br />
                  Emisión: {v.issuedLabel} · Vence: {v.dueLabel}
                  <br />
                  Importe: {v.amountLabel}
                </p>
                <div className="pinv-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="pinv-btn pinv-btn--outline" onClick={(e) => viewInvoice(v, e)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Ver factura
                  </button>
                  <button
                    type="button"
                    className="pinv-btn pinv-btn--outline"
                    disabled={downloadingId === v.invoice.id}
                    onClick={(e) => void downloadInvoice(v, e)}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    {downloadingId === v.invoice.id ? 'Descargando…' : 'Descargar PDF'}
                  </button>
                  {v.canPay ? (
                    <button
                      type="button"
                      className="pinv-btn pinv-btn--primary"
                      disabled={payingId === v.invoice.id}
                      onClick={(e) => void payInvoice(v, e)}
                    >
                      <CreditCard className="h-3.5 w-3.5" aria-hidden />
                      {payingId === v.invoice.id ? 'Procesando…' : 'Pagar ahora'}
                    </button>
                  ) : v.payment ? (
                    <a href={paymentsLinkForInvoice(v.invoice.id)} className="pinv-btn pinv-btn--outline no-underline">
                      Ver pago
                    </a>
                  ) : null}
                </div>
              </article>
            ))}

            <div className="pinv-foot">
              <span>
                Mostrando {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} a {Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
                {filtered.length} factura{filtered.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" className="pinv-btn pinv-btn--outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="pinv-btn pinv-btn--outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
                <span>{PAGE_SIZE} por página</span>
              </div>
            </div>

            <div className="pinv-helper">
              <h4 className="text-sm font-extrabold m-0">Pagos y recibos</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Cuando realices un pago, podrás consultarlo desde la sección Pagos y descargar el recibo si está disponible.
              </p>
              <a href="/paciente/pagos" className="pinv-btn pinv-btn--outline no-underline inline-flex">
                Ver mis pagos
              </a>
            </div>

            <div className="pinv-privacy">
              <h4 className="text-sm font-extrabold m-0">Privacidad</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Las facturas solo están disponibles para tu usuario y no pueden ser consultadas por otros pacientes.
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
              <div className="pinv-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="pinv-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle de factura</h3>
                  <button type="button" className="pinv-btn pinv-btn--outline lg:hidden" onClick={() => setSelectedId(null)} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-sm text-[var(--corp-navy)] m-0 mb-3 flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-teal-600" aria-hidden />
                  {selected.displayId}
                  <span className={`pinv-status ${statusClass(selected.effectiveStatus)}`}>{selected.statusText}</span>
                </p>
                <dl>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Concepto</dt>
                    <dd>{selected.concept}</dd>
                  </div>
                  <div>
                    <dt>Fecha de emisión</dt>
                    <dd>{selected.issuedLabel}</dd>
                  </div>
                  <div>
                    <dt>Fecha de vencimiento</dt>
                    <dd>{selected.dueLabel}</dd>
                  </div>
                  <div>
                    <dt>Importe</dt>
                    <dd>{selected.amountLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.statusText}</dd>
                  </div>
                  <div>
                    <dt>PDF</dt>
                    <dd className={selected.hasPdf ? 'pinv-pdf-ok' : ''}>{selected.pdfLabel}</dd>
                  </div>
                  <div>
                    <dt>Pago asociado</dt>
                    <dd>
                      {selected.payment ? (
                        <a href={paymentsLinkForInvoice(selected.invoice.id)}>{selected.paymentLabel}</a>
                      ) : (
                        selected.paymentLabel
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="pinv-preview">
                  {selected.hasPdf ? (
                    <div className="pinv-preview--pdf">
                      <FileText className="h-8 w-8 mx-auto text-teal-600 mb-1" aria-hidden />
                      Vista previa PDF · pulsa Ver factura para abrir
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">PDF no disponible</span>
                  )}
                </div>
                <div className="pinv-detail__actions">
                  <button
                    type="button"
                    className="pinv-btn pinv-btn--primary w-full"
                    disabled={downloadingId === selected.invoice.id}
                    onClick={() => void downloadInvoice(selected)}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {downloadingId === selected.invoice.id ? 'Descargando…' : 'Descargar PDF'}
                  </button>
                  {selected.canPay ? (
                    <button
                      type="button"
                      className="pinv-btn pinv-btn--primary w-full"
                      disabled={payingId === selected.invoice.id}
                      onClick={() => void payInvoice(selected)}
                    >
                      <CreditCard className="h-4 w-4" aria-hidden />
                      {payingId === selected.invoice.id ? 'Procesando…' : 'Pagar ahora'}
                    </button>
                  ) : null}
                  <a href={paymentsLinkForInvoice(selected.invoice.id)} className="pinv-btn pinv-btn--outline w-full no-underline">
                    Ver pagos relacionados
                  </a>
                  <a
                    href={messagesWithInvoiceContext(selected.displayId, selected.concept)}
                    className="pinv-btn pinv-btn--outline w-full no-underline"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Enviar mensaje a la clínica
                  </a>
                </div>
                <div className="pinv-help">
                  <p className="m-0 text-xs text-slate-600">
                    <strong>¿Necesitas ayuda?</strong> Contacta con tu clínica si tienes dudas sobre esta factura.
                  </p>
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
