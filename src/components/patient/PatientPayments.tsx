import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Wallet,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { createPayment } from '@/lib/demoStore';
import { money } from '@/lib/format';
import { isClientDemoMode } from '@/lib/appMode';
import {
  buildPaymentKpis,
  downloadPatientReceipt,
  enrichPatientPayments,
  filterAndSortPayments,
  invoiceLinkForPayment,
  messagesWithPaymentContext,
  pendingInvoicesLink,
  visiblePaymentsForPatient,
  type PaymentChip,
  type PatientPaymentSort,
  type PatientPaymentView
} from '@/lib/patient/paymentsData';

const CHIPS: { id: PaymentChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'completado', label: 'Completados' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'fallido', label: 'Fallidos' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'recibo', label: 'Con recibo' }
];

function statusClass(status: PatientPaymentView['status']) {
  if (status === 'completado') return 'ppay-status--completed';
  if (status === 'fallido') return 'ppay-status--failed';
  if (status === 'pendiente') return 'ppay-status--pending';
  return 'ppay-status--other';
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
    <article className="ppay-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="ppay-kpi__label">{label}</p>
      <p className="ppay-kpi__value">{n}</p>
    </article>
  );
}

export function PatientPayments() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<PaymentChip>('all');
  const [sort, setSort] = useState<PatientPaymentSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const urlFactura = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('factura') ?? '';
  }, []);

  const basePayments = useMemo(() => {
    let list = visiblePaymentsForPatient(state, patient.id);
    if (urlFactura) list = list.filter((p) => p.invoiceId === urlFactura);
    return list;
  }, [state, patient.id, urlFactura]);

  const views = useMemo(() => enrichPatientPayments(state, basePayments), [state, basePayments]);

  const kpis = useMemo(() => buildPaymentKpis(views), [views]);

  const filtered = useMemo(() => filterAndSortPayments(views, { q, chip, sort }), [views, q, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = useMemo(
    () =>
      filtered.find((v) => v.payment.id === selectedId) ?? views.find((v) => v.payment.id === selectedId) ?? null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/pagos',
        resourceLabel: 'Listado de pagos'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => {
    setPage(1);
  }, [q, chip, sort]);

  useEffect(() => {
    if (!selectedId && pageRows[0]) setSelectedId(pageRows[0].payment.id);
    if (selectedId && !filtered.some((v) => v.payment.id === selectedId) && pageRows[0]) {
      setSelectedId(pageRows[0].payment.id);
    }
  }, [filtered, pageRows, selectedId]);

  const openDetail = useCallback(
    (v: PatientPaymentView) => {
      setSelectedId(v.payment.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/pagos',
          resourceLabel: v.displayId,
          resourceId: v.payment.id
        });
      }
    },
    [portalAccess.active]
  );

  function viewDetail(v: PatientPaymentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    openDetail(v);
  }

  function downloadReceipt(v: PatientPaymentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!v.canDownloadReceipt) {
      setNotice({ type: 'error', message: 'No se pudo descargar el recibo.' });
      return;
    }
    setDownloadingId(v.payment.id);
    try {
      const ok = downloadPatientReceipt(v);
      if (!ok) throw new Error('fail');
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/pagos',
          resourceLabel: `Descarga recibo ${v.displayId}`,
          resourceId: v.payment.id
        });
      }
      setNotice({ type: 'ok', message: 'Recibo descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el recibo.' });
    } finally {
      setDownloadingId(null);
    }
  }

  async function retryPayment(v: PatientPaymentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!v.invoiceId) {
      setNotice({ type: 'error', message: 'No se pudo iniciar el pago.' });
      return;
    }
    const inv = state.invoices.find((i) => i.id === v.invoiceId && i.patientId === patient.id);
    if (!inv) {
      setNotice({ type: 'error', message: 'No se pudo iniciar el pago.' });
      return;
    }
    setRetryingId(v.payment.id);
    try {
      if (!isClientDemoMode()) {
        const res = await fetch('/api/billing/stripe-checkout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId: patient.preferredClinicId,
            patientId: patient.id,
            invoiceId: inv.id,
            amount: inv.amount,
            concept: inv.concept
          })
        });
        const json = (await res.json()) as { data?: { checkoutUrl?: string }; error?: { message?: string } };
        if (res.ok && json.data?.checkoutUrl) {
          window.location.href = json.data.checkoutUrl;
          return;
        }
        setNotice({ type: 'error', message: json.error?.message ?? 'No se pudo iniciar el pago.' });
        return;
      }
      commit(
        createPayment(state, {
          patientId: patient.id,
          invoiceId: inv.id,
          amount: inv.amount,
          method: v.payment.method,
          status: 'completado',
          paidAt: new Date().toISOString().slice(0, 10)
        })
      );
      setNotice({ type: 'ok', message: 'Pago completado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo iniciar el pago.' });
    } finally {
      setRetryingId(null);
    }
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <div className="ppay-page">
      {urlFactura ? (
        <div className="banner-alert flex flex-wrap items-center justify-between gap-2 mb-3">
          <span>Pagos filtrados por factura vinculada.</span>
          <a href="/paciente/pagos" className="text-xs font-bold text-teal-800 underline">
            Ver todos los pagos
          </a>
        </div>
      ) : null}
      <header className="ppay-header">
        <h2>Mis pagos</h2>
        <p>Consulta tus pagos realizados, recibos descargables y pagos vinculados a tus facturas.</p>
        <div className="ppay-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Pagos seguros</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Solo tú puedes consultar los pagos vinculados a tu perfil.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="ppay-kpis">
          <KpiStat label="Pagos realizados" value={kpis.completedCount} delay={0} numeric />
          <KpiStat label="Total pagado" value={money(kpis.totalPaid)} delay={50} />
          <KpiStat label="Pagos pendientes" value={kpis.pendingCount} delay={100} numeric />
          <KpiStat label="Último pago" value={kpis.lastPayment} delay={150} />
          <KpiStat label="Recibos disponibles" value={kpis.receiptsAvailable} delay={200} numeric />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="ppay-toolbar">
          <label className="ppay-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por factura, importe, método, fecha o clínica…"
              aria-label="Buscar pagos"
            />
          </label>
          <div className="ppay-toolbar__row">
            <div className="ppay-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`ppay-chip${chip === c.id ? ' ppay-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="ppay-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as PatientPaymentSort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
                <option value="amount">Ordenar por: importe mayor</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="ppay-empty">
          <div className="prt-empty__icon mx-auto" style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet className="h-8 w-8 text-teal-700" aria-hidden />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] mt-3 m-0">Aún no tienes pagos registrados</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            Cuando realices un pago o la clínica registre un cobro vinculado a tus facturas, aparecerá aquí.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href={pendingInvoicesLink()} className="ppay-btn ppay-btn--primary no-underline">
              Ver facturas pendientes
            </a>
            <a href="/paciente/mensajes" className="ppay-btn ppay-btn--outline no-underline">
              Contactar clínica
            </a>
          </div>
        </section>
      ) : showNoResults ? (
        <section className="ppay-empty">
          <p className="font-bold m-0">No tienes pagos registrados</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o búsqueda.</p>
        </section>
      ) : (
        <div className="ppay-layout">
          <div>
            <h3 className="ppay-list-title">Historial de pagos</h3>
            {pageRows.map((v, i) => (
              <article
                key={v.payment.id}
                className={`ppay-card${selectedId === v.payment.id ? ' ppay-card--active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
              >
                <div className="ppay-card__head">
                  <h4>{v.displayId}</h4>
                  <span className={`ppay-status ${statusClass(v.status)}`}>{v.statusText}</span>
                </div>
                <p className="ppay-card__concept">Factura: {v.invoiceDisplayId}</p>
                <p className="ppay-card__meta">
                  {v.clinicName}
                  <br />
                  Fecha: {v.dateLabel} · Método: {v.methodLabel}
                  <br />
                  Importe: {v.amountLabel}
                </p>
                <div className="ppay-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="ppay-btn ppay-btn--outline" onClick={(e) => viewDetail(v, e)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Ver detalle
                  </button>
                  {v.canDownloadReceipt ? (
                    <button
                      type="button"
                      className="ppay-btn ppay-btn--outline"
                      disabled={downloadingId === v.payment.id}
                      onClick={(e) => downloadReceipt(v, e)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {downloadingId === v.payment.id ? 'Descargando…' : 'Descargar recibo'}
                    </button>
                  ) : null}
                  {v.canRetry ? (
                    <button
                      type="button"
                      className="ppay-btn ppay-btn--primary"
                      disabled={retryingId === v.payment.id}
                      onClick={(e) => void retryPayment(v, e)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      {retryingId === v.payment.id ? 'Procesando…' : 'Reintentar pago'}
                    </button>
                  ) : null}
                  {v.invoiceId ? (
                    <a href={invoiceLinkForPayment(v.invoiceId)} className="ppay-btn ppay-btn--outline no-underline">
                      Ver factura
                    </a>
                  ) : null}
                </div>
              </article>
            ))}

            <div className="ppay-foot">
              <span>
                Mostrando {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} a {Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
                {filtered.length} pago{filtered.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" className="ppay-btn ppay-btn--outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="ppay-btn ppay-btn--outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
                <span>{PAGE_SIZE} por página</span>
              </div>
            </div>

            <div className="ppay-helper">
              <h4 className="text-sm font-extrabold m-0">Facturas pendientes</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Si tienes importes pendientes, puedes revisarlos desde la sección Mis facturas.
              </p>
              <a href="/paciente/facturas" className="ppay-btn ppay-btn--outline no-underline inline-flex">
                Ver mis facturas
              </a>
            </div>

            <div className="ppay-privacy">
              <h4 className="text-sm font-extrabold m-0">Privacidad</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Los pagos solo están disponibles para tu usuario y no pueden ser consultados por otros pacientes.
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
              <div className="ppay-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="ppay-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle del pago</h3>
                  <button type="button" className="ppay-btn ppay-btn--outline lg:hidden" onClick={() => setSelectedId(null)} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-sm text-[var(--corp-navy)] m-0 mb-3 flex items-center gap-2 flex-wrap">
                  <Wallet className="h-4 w-4 text-teal-600" aria-hidden />
                  {selected.displayId}
                  <span className={`ppay-status ${statusClass(selected.status)}`}>{selected.statusText}</span>
                </p>
                <dl>
                  <div>
                    <dt>Factura vinculada</dt>
                    <dd>
                      {selected.invoiceId ? (
                        <a href={invoiceLinkForPayment(selected.invoiceId)}>{selected.invoiceDisplayId}</a>
                      ) : (
                        selected.invoiceDisplayId
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{selected.dateLabel}</dd>
                  </div>
                  <div>
                    <dt>Importe</dt>
                    <dd>{selected.amountLabel}</dd>
                  </div>
                  <div>
                    <dt>Método</dt>
                    <dd>{selected.methodLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.statusText}</dd>
                  </div>
                  <div>
                    <dt>Referencia</dt>
                    <dd>{selected.reference}</dd>
                  </div>
                  <div>
                    <dt>Recibo</dt>
                    <dd className={selected.hasReceipt ? 'ppay-receipt-ok' : ''}>{selected.receiptLabel}</dd>
                  </div>
                </dl>
                <div className="ppay-preview">
                  {selected.canDownloadReceipt ? (
                    <div className="ppay-preview--receipt">
                      <FileText className="h-8 w-8 mx-auto text-teal-600 mb-1" aria-hidden />
                      Vista previa del recibo · descarga disponible
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Recibo no disponible</span>
                  )}
                </div>
                <div className="ppay-detail__actions">
                  {selected.canDownloadReceipt ? (
                    <button
                      type="button"
                      className="ppay-btn ppay-btn--primary w-full"
                      disabled={downloadingId === selected.payment.id}
                      onClick={() => downloadReceipt(selected)}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      {downloadingId === selected.payment.id ? 'Descargando…' : 'Descargar recibo'}
                    </button>
                  ) : null}
                  {selected.canRetry ? (
                    <button
                      type="button"
                      className="ppay-btn ppay-btn--primary w-full"
                      disabled={retryingId === selected.payment.id}
                      onClick={() => void retryPayment(selected)}
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      {retryingId === selected.payment.id ? 'Procesando…' : 'Reintentar pago'}
                    </button>
                  ) : null}
                  {selected.invoiceId ? (
                    <a href={invoiceLinkForPayment(selected.invoiceId)} className="ppay-btn ppay-btn--outline w-full no-underline">
                      Ver factura
                    </a>
                  ) : null}
                  <a
                    href={messagesWithPaymentContext(selected.displayId, selected.invoiceDisplayId)}
                    className="ppay-btn ppay-btn--outline w-full no-underline"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Enviar mensaje a la clínica
                  </a>
                </div>
                <div className="ppay-help">
                  <p className="m-0 text-xs text-slate-600">
                    <strong>¿Necesitas ayuda?</strong> Contacta con tu clínica si tienes dudas sobre este pago.
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
