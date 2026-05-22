import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  BarChart3,
  Check,
  Clock,
  CreditCard,
  Download,
  FileText,
  Plus,
  Search,
  Wallet
} from 'lucide-react';
import { getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import {
  addMessage,
  createPayment,
  exportCsv,
  getStoredTenantId,
  saveInvoice,
  settingsFor
} from '@/lib/demoStore';
import { downloadDemoFileRef, saveDemoFile } from '@/lib/demoFiles';
import { generateTextSummaryPdf } from '@/lib/pdfInvoice';
import {
  computePaymentKpis,
  displayPaymentId,
  filterPayments,
  formatPayDate,
  formatPayTime,
  invoiceLabel,
  patientLine,
  paymentMethodLabel,
  paymentStatusLabel,
  sortPayments,
  type PaymentFilter,
  type PaymentSort
} from '@/lib/paymentAdmin';
import { money, todayIso } from '@/lib/format';
import { patientsForClinic } from '@/lib/tenant';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useTenant } from '@/hooks/useTenant';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/demo';
import { positiveAmount, required } from '@/lib/validation';

const PAGE_SIZE = 10;

const FILTER_CHIPS: { id: PaymentFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'completado', label: 'Completados' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'fallido', label: 'Fallidos' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' }
];

function statusClass(s: PaymentStatus) {
  if (s === 'completado') return 'pay-badge--ok';
  if (s === 'fallido') return 'pay-badge--fail';
  return 'pay-badge--pending';
}

function MethodIcon({ method }: { method: PaymentMethod }) {
  if (method === 'tarjeta') return <CreditCard className="h-3.5 w-3.5" />;
  if (method === 'efectivo') return <Banknote className="h-3.5 w-3.5" />;
  return <Wallet className="h-3.5 w-3.5" />;
}

export function AdminPayments() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const clinicPatients = useMemo(
    () => (clinic ? patientsForClinic(state, clinic.id) : state.patients),
    [state, clinic]
  );

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [filter, setFilter] = useState<PaymentFilter>('todos');
  const [sort, setSort] = useState<PaymentSort>('fecha');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    patientId: clinicPatients[0]?.id ?? '',
    invoiceId: '',
    amount: 85,
    method: 'tarjeta' as PaymentMethod,
    status: 'completado' as PaymentStatus,
    paidAt: todayIso(),
    notes: '',
    notifyPatient: true
  });

  const payments = scope.payments;
  const filtered = useMemo(
    () => sortPayments(filterPayments(payments, state, filter, debouncedSearch), state, sort),
    [payments, state, filter, debouncedSearch, sort]
  );
  const clinicSettings = settingsFor(state, tenantId);
  const kpis = useMemo(() => computePaymentKpis(payments), [payments]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const selected = useMemo(() => {
    if (selectedId) return payments.find((p) => p.id === selectedId) ?? null;
    return pageItems[0] ?? null;
  }, [selectedId, payments, pageItems]);

  useEffect(() => setPage(1), [debouncedSearch, filter, sort]);

  const patientInvoices = state.invoices.filter((i) => i.patientId === form.patientId);

  async function registerPayment() {
    const err = required(form.patientId, 'Paciente') || positiveAmount(form.amount);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    setSaving(true);
    try {
      let receiptRef: string | undefined;
      let receiptFileName: string | undefined;
      if (receipt) {
        receiptRef = await saveDemoFile(receipt);
        receiptFileName = receipt.name;
      }
      if (!isClientDemoMode()) {
        const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
        if (clinicId) {
          await fetch('/api/billing/payment', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              clinicId,
              patientId: form.patientId,
              invoiceId: form.invoiceId || undefined,
              amount: form.amount,
              provider: form.method,
              status: form.status
            })
          });
        }
        await refresh();
        setNotice({ type: 'ok', message: 'Pago registrado correctamente.' });
        return;
      }
      commit(
        createPayment(state, {
          patientId: form.patientId,
          invoiceId: form.invoiceId || undefined,
          amount: form.amount,
          method: form.method,
          status: form.status,
          paidAt: form.paidAt,
          notes: form.notes,
          receiptRef,
          receiptFileName,
          notifyPatient: form.notifyPatient
        })
      );
      setNotice({ type: 'ok', message: 'Pago registrado.' });
      setReceipt(null);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo registrar el pago.' });
    } finally {
      setSaving(false);
    }
  }

  function exportCsvFile(rows: Payment[]) {
    exportCsv(
      rows.map((p) => ({
        id: displayPaymentId(p),
        paciente: patientLine(state, p.patientId),
        factura: invoiceLabel(state, p.invoiceId),
        metodo: paymentMethodLabel(p.method),
        importe: p.amount,
        estado: p.status,
        fecha: p.paidAt ?? p.createdAt
      })),
      'pagos.csv'
    );
    setNotice({ type: 'ok', message: 'CSV exportado.' });
  }

  async function exportPdfReport(rows: Payment[]) {
    const lines = [
      clinicSettings.clinicName ?? 'Clínica',
      'INFORME DE PAGOS',
      `Generado: ${formatPayDate(todayIso())}`,
      '',
      ...rows.flatMap((p) => [
        displayPaymentId(p),
        patientLine(state, p.patientId),
        invoiceLabel(state, p.invoiceId),
        paymentMethodLabel(p.method),
        money(p.amount),
        paymentStatusLabel(p.status),
        ''
      ])
    ];
    const { fileRef, fileName } = await generateTextSummaryPdf('informe-pagos', lines);
    downloadDemoFileRef(fileRef, fileName);
    setNotice({ type: 'ok', message: 'Informe PDF descargado.' });
  }

  async function notifyPatient(patientId: string, subject: string, body: string) {
    const patient = state.patients.find((p) => p.id === patientId);
    const clinicId = patient?.preferredClinicId;
    if (!isClientDemoMode() && clinicId) {
      await fetch('/api/records/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clinicId, patientId, subject, body, channel: 'email', type: 'clinica' })
      });
      return;
    }
    commit(
      addMessage(state, {
        patientId,
        subject,
        body,
        channel: 'email',
        type: 'clinica',
        read: false,
        sentAt: new Date().toISOString()
      })
    );
  }

  function markLinkedInvoicePaid(payment: Payment) {
    if (!payment.invoiceId) return;
    const inv = state.invoices.find((i) => i.id === payment.invoiceId);
    if (!inv) {
      setNotice({ type: 'error', message: 'No se encontró la factura vinculada.' });
      return;
    }
    commit(saveInvoice(state, { ...inv, status: 'pagada' }));
    setNotice({ type: 'ok', message: 'Factura marcada como pagada.' });
  }

  function downloadReceipt(payment: Payment) {
    if (!payment.receiptRef) {
      setNotice({ type: 'error', message: 'Este pago no tiene justificante adjunto.' });
      return;
    }
    downloadDemoFileRef(payment.receiptRef, payment.receiptFileName ?? `recibo-${payment.id}.pdf`);
    setNotice({ type: 'ok', message: 'Recibo descargado.' });
  }

  const from = filtered.length ? (pageSafe - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="pay-module">
      <header className="pay-module__head">
        <div>
          <h1>Pagos</h1>
          <p>Registra cobros, controla pagos pendientes y vincula cada ingreso a su factura.</p>
        </div>
        <div className="pay-module__actions">
          <button type="button" className="pay-btn-secondary" onClick={() => exportCsvFile(filtered)}>
            <FileText className="h-4 w-4" /> Exportar CSV
          </button>
          <button type="button" className="pay-btn-secondary" onClick={() => void exportPdfReport(filtered)}>
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
          <button type="button" className="pay-btn-primary" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            <Plus className="h-4 w-4" /> Registrar pago
          </button>
        </div>
      </header>

      <div className="pay-kpis">
          <div className="pay-kpi">
            <span className="pay-kpi__icon pay-kpi__icon--amber">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="pay-kpi__label">Pagos pendientes</p>
              <p className="pay-kpi__value">{kpis.pendingCount}</p>
              <p className="pay-kpi__trend">{money(kpis.pendingAmount)}</p>
            </div>
          </div>
          <div className="pay-kpi">
            <span className="pay-kpi__icon pay-kpi__icon--green">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <p className="pay-kpi__label">Completados</p>
              <p className="pay-kpi__value">{kpis.completedCount}</p>
              <p className="pay-kpi__trend">{money(kpis.monthTotal)} este mes</p>
            </div>
          </div>
          <div className="pay-kpi">
            <span className="pay-kpi__icon pay-kpi__icon--red">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="pay-kpi__label">Fallidos</p>
              <p className="pay-kpi__value">{kpis.failedCount}</p>
              <p className="pay-kpi__trend">Requiere revisión</p>
            </div>
          </div>
          <div className="pay-kpi">
            <span className="pay-kpi__icon pay-kpi__icon--blue">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className="pay-kpi__label">Importe medio</p>
              <p className="pay-kpi__value">{money(kpis.avgAmount)}</p>
              <p className="pay-kpi__trend">Por pago</p>
            </div>
          </div>
          <div className="pay-kpi">
            <span className="pay-kpi__icon pay-kpi__icon--teal">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <p className="pay-kpi__label">Método principal</p>
              <p className="pay-kpi__value" style={{ fontSize: '1rem' }}>
                {kpis.topMethod}
              </p>
            </div>
          </div>
        </div>

      <div className="pay-toolbar">
        <div className="pay-search">
          <Search aria-hidden />
          <input
            type="search"
            placeholder="Buscar por paciente, NHC, DNI, factura…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pay-toolbar__row">
          <div className="pay-chips pay-chips--scroll">
            {FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`pay-chip${filter === c.id ? ' pay-chip--active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <select className="pay-sort" value={sort} onChange={(e) => setSort(e.target.value as PaymentSort)}>
            <option value="fecha">Ordenar por: fecha de pago</option>
            <option value="importe">Ordenar por: importe</option>
            <option value="paciente">Ordenar por: paciente</option>
            <option value="estado">Ordenar por: estado</option>
          </select>
        </div>
      </div>

      <div className="pay-grid">
        <section className="pay-card">
          <h2>Listado de pagos</h2>
          <div className="pay-table-wrap">
            <table className="pay-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar página"
                      checked={pageItems.length > 0 && pageItems.every((p) => checked.has(p.id))}
                      onChange={() => {
                        const all = pageItems.every((p) => checked.has(p.id));
                        const next = new Set(checked);
                        pageItems.forEach((p) => (all ? next.delete(p.id) : next.add(p.id)));
                        setChecked(next);
                      }}
                    />
                  </th>
                  <th>Pago</th>
                  <th>Paciente</th>
                  <th>Factura</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr
                    key={p.id}
                    className={`pay-row${selected?.id === p.id ? ' pay-row--selected' : ''}`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked.has(p.id)}
                        onChange={() => {
                          const next = new Set(checked);
                          if (next.has(p.id)) next.delete(p.id);
                          else next.add(p.id);
                          setChecked(next);
                        }}
                      />
                    </td>
                    <td>
                      <strong>{displayPaymentId(p)}</strong>
                    </td>
                    <td>{patientLine(state, p.patientId)}</td>
                    <td>{invoiceLabel(state, p.invoiceId)}</td>
                    <td>
                      <span className="pay-method">
                        <MethodIcon method={p.method} /> {paymentMethodLabel(p.method)}
                      </span>
                    </td>
                    <td>{formatPayDate(p.paidAt ?? p.createdAt)}</td>
                    <td style={{ fontWeight: 800 }}>{money(p.amount)}</td>
                    <td>
                      <span className={`pay-badge ${statusClass(p.status)}`}>{paymentStatusLabel(p.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="pay-card__foot">
            <span>
              Mostrando {from} a {to} de {filtered.length} pago{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="pay-pager">
              <button type="button" disabled={pageSafe <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
                ‹
              </button>
              <span>{pageSafe}</span>
              <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage((x) => x + 1)}>
                ›
              </button>
            </div>
          </footer>
        </section>

        <aside className="pay-side" ref={formRef}>
          <div className="pay-card pay-form">
            <h2>Registrar pago</h2>
            <div className="pay-field">
              <label>Paciente *</label>
              <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value, invoiceId: '' })}>
                {clinicPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="pay-field">
              <label>Factura vinculada</label>
              <select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
                <option value="">Sin factura</option>
                {patientInvoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {invoiceLabel(state, i.id)} · {money(i.amount)}
                  </option>
                ))}
              </select>
            </div>
            <div className="pay-field">
              <label>Importe *</label>
              <input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="pay-field">
              <label>Método</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                {(['tarjeta', 'efectivo', 'transferencia', 'seguro', 'otro'] as const).map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="pay-field">
              <label>Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
                <option value="fallido">Fallido</option>
              </select>
            </div>
            <div className="pay-field">
              <label>Fecha de pago</label>
              <input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
            </div>
            <div className="pay-field">
              <label>Notas internas</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="pay-drop">
              <p>Adjuntar justificante (opcional)</p>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
              {receipt ? <span>{receipt.name}</span> : null}
            </div>
            <label className="pay-toggle">
              <input type="checkbox" checked={form.notifyPatient} onChange={(e) => setForm({ ...form, notifyPatient: e.target.checked })} />
              Enviar recibo al paciente
            </label>
            <button type="button" className="pay-btn-primary pay-btn-primary--block" disabled={saving} onClick={() => void registerPayment()}>
              Registrar pago
            </button>
          </div>

          {selected ? (
            <div className="pay-card pay-preview">
              <h2>Vista previa del pago</h2>
              <p>
                <strong>{displayPaymentId(selected)}</strong>
              </p>
              <p>{patientLine(state, selected.patientId)}</p>
              <p>Factura: {invoiceLabel(state, selected.invoiceId)}</p>
              <p>Importe: {money(selected.amount)}</p>
              <p>Método: {paymentMethodLabel(selected.method)}</p>
              <p>Hora: {formatPayTime(selected.paidAt ?? selected.createdAt)}</p>
              <span className={`pay-badge ${statusClass(selected.status)}`}>{paymentStatusLabel(selected.status)}</span>
              <div className="pay-preview__actions">
                <button type="button" className="pay-btn-secondary" onClick={() => downloadReceipt(selected)}>
                  Descargar recibo
                </button>
                <button
                  type="button"
                  className="pay-btn-secondary"
                  onClick={() =>
                    void notifyPatient(
                      selected.patientId,
                      'Recibo de pago',
                      `Recibo ${displayPaymentId(selected)} por ${money(selected.amount)} registrado en la clínica.`
                    ).then(() => setNotice({ type: 'ok', message: 'Recibo enviado al paciente.' }))
                  }
                >
                  Enviar al paciente
                </button>
                {selected.invoiceId ? (
                  <button type="button" className="pay-btn-secondary" onClick={() => markLinkedInvoicePaid(selected)}>
                    <Check className="h-4 w-4" /> Marcar factura como pagada
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="pay-widgets">
        <div className="pay-tip">
          <strong>Consejo:</strong> Vincula cada pago a su factura para mantener la contabilidad al día.
        </div>
        <div className="pay-card">
          <h3>Resumen rápido</h3>
          <p>Hoy: {money(kpis.todaySum)}</p>
          <p>Semana: {money(kpis.weekSum)}</p>
          <p>Pendiente: {money(kpis.pendingAmount)}</p>
        </div>
        <div className="pay-card">
          <h3>Métodos más utilizados</h3>
          {Object.entries(kpis.methodCounts).map(([m, c]) => (
            <p key={m}>
              {paymentMethodLabel(m as PaymentMethod)}: {c}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
