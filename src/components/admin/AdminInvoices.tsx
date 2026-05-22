import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';
import { invoiceConceptFromAppointment } from '@/lib/clinical';
import { getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import {
  addMessage,
  createInvoice,
  deleteInvoice,
  exportCsv,
  getStoredTenantId,
  saveInvoice,
  settingsFor
} from '@/lib/demoStore';
import { downloadDemoFileRef, isPdfMime, resolveDemoFileUrl, saveDemoFile } from '@/lib/demoFiles';
import {
  calcInvoiceTotals,
  calcLineTotal,
  computeInvoiceKpis,
  displayInvoiceId,
  effectiveStatus,
  filterInvoices,
  formatDocDate,
  formatNhcDisplay,
  patientLine,
  reminderSummary,
  sortInvoices,
  statusLabel,
  type InvoiceFilter,
  type InvoiceSort
} from '@/lib/invoiceAdmin';
import { generateInvoicePdfFile, generateInvoicesSummaryPdf } from '@/lib/pdfInvoice';
import { patientDisplayCode } from '@/lib/nhc';
import { findPatientsByQuery } from '@/lib/patientSearch';
import { getPatientById, patientName } from '@/lib/selectors';
import { nextInvoiceId } from '@/lib/ids';
import { money, todayIso } from '@/lib/format';
import { patientsForClinic } from '@/lib/tenant';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useTenant } from '@/hooks/useTenant';
import type { Invoice, InvoiceLine, InvoiceStatus, Patient } from '@/types/demo';
import { Field, Input, Modal, Select } from '@/components/ui';

const PAGE_SIZE = 10;
const MAX_PDF = 10_000_000;

const FILTER_CHIPS: { id: InvoiceFilter; label: string; danger?: boolean }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'pagada', label: 'Pagadas' },
  { id: 'vencida', label: 'Vencidas', danger: true },
  { id: 'borrador', label: 'Borradores' },
  { id: 'enviada', label: 'Enviadas' },
  { id: 'con_pdf', label: 'Con PDF' },
  { id: 'sin_pdf', label: 'Sin PDF' }
];

const emptyLine = (vat: number): InvoiceLine => ({
  description: 'Limpieza dental profesional',
  quantity: 1,
  unitPrice: 80,
  taxPercent: vat
});

function statusBadgeClass(status: InvoiceStatus) {
  if (status === 'pagada') return 'inv-badge--pagada';
  if (status === 'vencida') return 'inv-badge--vencida';
  if (status === 'cancelada') return 'inv-badge--cancelada';
  return 'inv-badge--pendiente';
}

function InvPatientPicker({
  patients,
  patientId,
  onSelect,
  state
}: {
  patients: Patient[];
  patientId: string;
  onSelect: (id: string) => void;
  state: ReturnType<typeof useDemoStore>['state'];
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const scoped = useMemo(() => ({ ...state, patients }), [state, patients]);
  const matches = useMemo(() => {
    const list = findPatientsByQuery(scoped, q);
    return q.trim() ? list.slice(0, 8) : patients.slice(0, 8);
  }, [scoped, patients, q]);
  const selected = patients.find((p) => p.id === patientId);

  return (
    <div className="inv-field inv-patient-picker" style={{ position: 'relative' }}>
      <label>Paciente</label>
      {selected ? (
        <div className="inv-patient-chip">
          <span className="inv-patient-chip__val">
            {formatNhcDisplay(selected.nhc)} — {selected.fullName}
            <button type="button" aria-label="Quitar" onClick={() => onSelect('')}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
          <button type="button" className="inv-btn-ghost" onClick={() => setOpen(true)}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <input
          placeholder="Buscar por NHC, DNI o nombre…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      )}
      {open && matches.length ? (
        <ul>
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setQ('');
                  setOpen(false);
                }}
              >
                {patientDisplayCode(p)} — {p.fullName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RowMenu({ onAction }: { onAction: (a: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="inv-menu-wrap" ref={ref}>
      <button type="button" className="inv-btn-ghost" aria-label="Más" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <ul className="inv-menu">
          <li><button type="button" onClick={() => { onAction('edit'); setOpen(false); }}>Editar</button></li>
          <li><button type="button" onClick={() => { onAction('duplicate'); setOpen(false); }}>Duplicar</button></li>
          <li><button type="button" onClick={() => { onAction('archive'); setOpen(false); }}>Archivar</button></li>
          <li><button type="button" className="inv-menu__danger" onClick={() => { onAction('delete'); setOpen(false); }}>Eliminar</button></li>
        </ul>
      ) : null}
    </div>
  );
}

export function AdminInvoices() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();
  const clinicSettings = settingsFor(state, tenantId);
  const vat = clinicSettings.vatRate ?? 21;
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const clinicPatients = useMemo(
    () => (clinic ? patientsForClinic(state, clinic.id) : state.patients),
    [state, clinic]
  );

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('todas');
  const [sort, setSort] = useState<InvoiceSort>('vencimiento');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMode, setPdfMode] = useState<'upload' | 'auto'>('upload');
  const [autoPdf, setAutoPdf] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    patientId: clinicPatients[0]?.id ?? '',
    appointmentId: '',
    concept: clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos',
    lines: [emptyLine(vat)] as InvoiceLine[],
    discount: 0,
    status: 'pendiente' as InvoiceStatus,
    issuedAt: todayIso(),
    dueDate: '',
    portalVisible: true,
    notify: true
  });

  const invoices = scope.invoices;
  const today = todayIso();

  const filtered = useMemo(
    () => sortInvoices(filterInvoices(invoices, state, filter, search, today), state, sort, today),
    [invoices, state, filter, search, sort, today]
  );

  const kpis = useMemo(() => computeInvoiceKpis(invoices, today), [invoices, today]);
  const reminders = useMemo(() => reminderSummary(invoices, today), [invoices, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const selected = useMemo(() => {
    if (selectedId) return invoices.find((i) => i.id === selectedId) ?? null;
    return pageItems[0] ?? filtered[0] ?? null;
  }, [selectedId, invoices, pageItems, filtered]);

  const totals = useMemo(() => calcInvoiceTotals(form.lines, form.discount), [form.lines, form.discount]);
  const billedAnim = useCountUp(Math.round(kpis.billed));
  const pendingAnim = useCountUp(Math.round(kpis.pendingAmount));
  const overdueAnim = useCountUp(kpis.overdueCount);
  const paidAnim = useCountUp(kpis.paidCount);
  const avgAnim = useCountUp(Math.round(kpis.avgAmount));

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => setPage(1), [search, filter, sort]);

  useEffect(() => {
    if (!pdfFile) {
      setUploadPct(0);
      return;
    }
    setUploadPct(0);
    const id = window.setInterval(() => {
      setUploadPct((p) => (p >= 65 ? 65 : p + 10));
    }, 70);
    return () => window.clearInterval(id);
  }, [pdfFile]);

  const pickPdf = useCallback((file: File | null) => {
    setUploadError('');
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (!isPdfMime(file.type, file.name)) {
      setUploadError('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > MAX_PDF) {
      setUploadError('El PDF supera 10 MB.');
      return;
    }
    setPdfFile(file);
    setAutoPdf(false);
    setPdfMode('upload');
  }, []);

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

  function validateForm(): string | null {
    if (!form.patientId) return 'Selecciona un paciente.';
    if (!form.concept.trim()) return 'Introduce un concepto de factura.';
    if (!form.lines.length || form.lines.every((l) => !l.description.trim())) return 'Añade al menos un concepto.';
    if (totals.total <= 0) return 'El importe debe ser mayor que 0.';
    if (!form.issuedAt) return 'La fecha de emisión es obligatoria.';
    if (form.dueDate && form.dueDate < form.issuedAt) return 'La fecha de vencimiento no puede ser anterior a la emisión.';
    return null;
  }

  async function createInvoicePdf() {
    const err = validateForm();
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const patient = getPatientById(state, form.patientId);
    if (!patient) {
      setNotice({ type: 'error', message: 'Selecciona un paciente.' });
      return;
    }

    setSaving(true);
    try {
      const newId = nextInvoiceId(state);

      let fileRef: string | undefined;
      let fileName: string | undefined;
      const mimeType = 'application/pdf';

      if (pdfFile && pdfMode === 'upload') {
        fileRef = await saveDemoFile(pdfFile);
        fileName = pdfFile.name.endsWith('.pdf') ? pdfFile.name : `${pdfFile.name}.pdf`;
        setUploadPct(100);
      } else if (autoPdf || pdfMode === 'auto') {
        const draft: Invoice = {
          id: newId,
          tenantId,
          patientId: form.patientId,
          appointmentId: form.appointmentId || undefined,
          amount: totals.total,
          concept: form.concept.trim(),
          status: form.status,
          issuedAt: form.issuedAt,
          dueDate: form.dueDate || undefined,
          lines: form.lines,
          discount: form.discount
        };
        const gen = await generateInvoicePdfFile(draft, patient, clinicSettings);
        fileRef = gen.fileRef;
        fileName = gen.fileName;
      } else {
        setNotice({ type: 'error', message: 'Sube un PDF o activa generación automática.' });
        return;
      }

      const payload: Omit<Invoice, 'tenantId'> & { tenantId?: string } = {
        id: newId,
        patientId: form.patientId,
        appointmentId: form.appointmentId || undefined,
        amount: totals.total,
        concept: form.concept.trim(),
        status: form.status,
        issuedAt: form.issuedAt,
        dueDate: form.dueDate || undefined,
        fileRef,
        fileName,
        mimeType,
        lines: form.lines,
        discount: form.discount,
        portalVisible: form.portalVisible
      };

      if (!isClientDemoMode()) {
        const clinicId = patient.preferredClinicId;
        if (clinicId) {
          const res = await fetch('/api/billing/invoice', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              clinicId,
              patientId: form.patientId,
              appointmentId: form.appointmentId || undefined,
              amount: totals.total,
              concept: form.concept.trim(),
              status: form.status,
              dueDate: form.dueDate || undefined
            })
          });
          if (!res.ok) throw new Error('No se pudo crear la factura. Inténtalo de nuevo.');
        }
        commit(createInvoice(state, payload));
        await refresh();
      } else {
        commit(createInvoice(state, payload));
      }

      if (form.notify) {
        await notifyPatient(
          form.patientId,
          'Nueva factura disponible',
          `Tienes una factura por ${money(totals.total)}: ${form.concept.trim()}.`
        );
      }

      setNotice({ type: 'ok', message: 'Factura PDF creada.' });
      setForm((f) => ({
        ...f,
        concept: clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos',
        lines: [emptyLine(vat)],
        discount: 0
      }));
      setPdfFile(null);
      setSelectedId(newId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear la factura. Inténtalo de nuevo.';
      setNotice({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  function updateInvoice(inv: Invoice, patch: Partial<Invoice>) {
    commit(saveInvoice(state, { ...inv, ...patch }));
  }

  function markPaid(inv: Invoice) {
    updateInvoice(inv, { status: 'pagada' });
    setNotice({ type: 'ok', message: 'Factura marcada como pagada.' });
  }

  async function sendReminder(inv: Invoice) {
    await notifyPatient(
      inv.patientId,
      'Recordatorio de factura',
      `Recordatorio: la factura ${displayInvoiceId(inv)} por ${money(inv.amount)} está pendiente.`
    );
    updateInvoice(inv, { sentAt: new Date().toISOString() });
    setNotice({ type: 'ok', message: 'Recordatorio enviado al paciente.' });
  }

  async function sendToPatient(inv: Invoice) {
    await notifyPatient(
      inv.patientId,
      'Factura disponible',
      `Tu factura ${displayInvoiceId(inv)} (${money(inv.amount)}) ya está disponible en el portal.`
    );
    updateInvoice(inv, { sentAt: new Date().toISOString() });
    setNotice({ type: 'ok', message: 'Factura enviada al paciente.' });
  }

  function handleRowAction(inv: Invoice, action: string) {
    if (action === 'edit') {
      setEditInv(inv);
      return;
    }
    if (action === 'duplicate') {
      commit(
        createInvoice(state, {
          patientId: inv.patientId,
          appointmentId: inv.appointmentId,
          amount: inv.amount,
          concept: `${inv.concept} (copia)`,
          status: 'pendiente',
          issuedAt: todayIso(),
          dueDate: inv.dueDate,
          fileRef: inv.fileRef,
          fileName: inv.fileName,
          mimeType: inv.mimeType,
          lines: inv.lines,
          discount: inv.discount,
          portalVisible: inv.portalVisible
        })
      );
      setNotice({ type: 'ok', message: 'Factura duplicada.' });
      return;
    }
    if (action === 'archive') {
      updateInvoice(inv, { status: 'cancelada', concept: `[Archivada] ${inv.concept}` });
      setNotice({ type: 'ok', message: 'Factura archivada.' });
      return;
    }
    if (action === 'delete') setDeleteId(inv.id);
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllPage() {
    const ids = pageItems.map((i) => i.id);
    const allOn = ids.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const selectedRows = invoices.filter((i) => checked.has(i.id));

  function exportCsvFile(rows: Invoice[]) {
    exportCsv(
      rows.map((i) => ({
        factura: displayInvoiceId(i),
        paciente: patientName(state, i.patientId),
        concepto: i.concept,
        emision: i.issuedAt,
        vencimiento: i.dueDate ?? '',
        importe: i.amount,
        estado: statusLabel(effectiveStatus(i, today)),
        pdf: i.fileName ?? ''
      })),
      'facturas.csv'
    );
  }

  async function exportPdfReport(rows: Invoice[]) {
    const lines = [
      clinicSettings.clinicName ?? 'Clínica',
      'INFORME DE FACTURACIÓN',
      `Generado: ${formatDocDate(today)}`,
      '',
      ...rows.flatMap((i) => [
        displayInvoiceId(i),
        patientLine(state, i.patientId),
        i.concept,
        money(i.amount),
        statusLabel(effectiveStatus(i, today)),
        ''
      ])
    ];
    const { fileRef, fileName } = await generateInvoicesSummaryPdf(rows, lines);
    downloadDemoFileRef(fileRef, fileName);
    setNotice({ type: 'ok', message: 'Informe PDF descargado.' });
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const appts = scope.appointments.filter((a) => a.patientId === form.patientId);
  const from = filtered.length ? (pageSafe - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);
  const bulkOn = checked.size > 0;

  return (
    <div className="inv-module">
      <header className="inv-module__head">
        <div>
          <h1>Facturación</h1>
          <p>Gestiona facturas, cobros, vencimientos y PDFs vinculados a cada paciente.</p>
        </div>
        <div className="inv-module__actions">
          <button type="button" className="inv-btn-secondary" onClick={() => exportCsvFile(filtered)}>
            <FileText className="h-4 w-4" /> Exportar CSV
          </button>
          <button type="button" className="inv-btn-secondary" onClick={() => void exportPdfReport(filtered)}>
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
          <button type="button" className="inv-btn-primary" onClick={scrollToForm}>
            <Plus className="h-4 w-4" /> Nueva factura
          </button>
        </div>
      </header>

      {loading ? (
        <div className="inv-kpis">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="inv-skeleton" />
          ))}
        </div>
      ) : (
        <div className="inv-kpis">
          <div className="inv-kpi">
            <div className="inv-kpi__row">
              <span className="inv-kpi__icon inv-kpi__icon--green">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="inv-kpi__label">Facturado este mes</p>
                <p className="inv-kpi__value">{money(billedAnim)}</p>
                <p className={`inv-kpi__trend${kpis.trendPct >= 0 ? ' inv-kpi__trend--up' : ''}`}>
                  {kpis.trendPct >= 0 ? '+' : ''}
                  {kpis.trendPct}% vs mes anterior
                </p>
              </div>
            </div>
          </div>
          <div className="inv-kpi">
            <div className="inv-kpi__row">
              <span className="inv-kpi__icon inv-kpi__icon--amber">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="inv-kpi__label">Pendiente de cobro</p>
                <p className="inv-kpi__value">{money(pendingAnim)}</p>
                <p className="inv-kpi__trend">{kpis.pendingCount} facturas pendientes</p>
              </div>
            </div>
          </div>
          <div className="inv-kpi">
            <div className="inv-kpi__row">
              <span className="inv-kpi__icon inv-kpi__icon--red">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="inv-kpi__label">Facturas vencidas</p>
                <p className="inv-kpi__value">{overdueAnim}</p>
                <p className="inv-kpi__trend">Requiere revisión</p>
              </div>
            </div>
          </div>
          <div className="inv-kpi">
            <div className="inv-kpi__row">
              <span className="inv-kpi__icon inv-kpi__icon--green">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <p className="inv-kpi__label">Pagadas</p>
                <p className="inv-kpi__value">{paidAnim}</p>
                <p className="inv-kpi__trend">{kpis.paidPct}% del total</p>
              </div>
            </div>
          </div>
          <div className="inv-kpi">
            <div className="inv-kpi__row">
              <span className="inv-kpi__icon inv-kpi__icon--blue">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <p className="inv-kpi__label">Importe medio</p>
                <p className="inv-kpi__value">{money(avgAnim)}</p>
                <p className="inv-kpi__trend">Por factura</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="inv-toolbar">
        <div className="inv-search">
          <Search aria-hidden />
          <input
            type="search"
            placeholder="Buscar por paciente, NHC, DNI, nº factura, concepto o importe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="inv-toolbar__row">
          <div className="inv-chips inv-chips--scroll">
            {FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`inv-chip${filter === c.id ? ' inv-chip--active' : ''}${c.danger ? ' inv-chip--danger' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="inv-sort">
            <select value={sort} onChange={(e) => setSort(e.target.value as InvoiceSort)}>
              <option value="vencimiento">Ordenar por: vencimiento</option>
              <option value="emision">Ordenar por: emisión</option>
              <option value="importe">Ordenar por: importe</option>
              <option value="paciente">Ordenar por: paciente</option>
              <option value="estado">Ordenar por: estado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="inv-grid">
        <section className="inv-card">
          <div className="inv-card__head">
            <h2>Listado de facturas</h2>
          </div>
          <div className="inv-bulk">
            <button type="button" disabled={!bulkOn} onClick={() => selectedRows.forEach(markPaid)}>
              Marcar como pagadas
            </button>
            <button type="button" disabled={!bulkOn} onClick={() => void Promise.all(selectedRows.map(sendReminder))}>
              Enviar recordatorio
            </button>
            <button type="button" disabled={!bulkOn} onClick={() => exportCsvFile(selectedRows)}>
              Exportar selección
            </button>
            <button
              type="button"
              disabled={!bulkOn}
              onClick={() => {
                selectedRows.forEach((i) => commit(deleteInvoice(state, i.id)));
                setChecked(new Set());
                setNotice({ type: 'ok', message: 'Facturas eliminadas.' });
              }}
            >
              Eliminar selección
            </button>
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar página"
                      checked={pageItems.length > 0 && pageItems.every((i) => checked.has(i.id))}
                      onChange={toggleAllPage}
                    />
                  </th>
                  <th>Factura</th>
                  <th>Paciente</th>
                  <th>Concepto</th>
                  <th>Emisión</th>
                  <th>Vencimiento</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((inv) => {
                  const st = effectiveStatus(inv, today);
                  return (
                    <tr
                      key={inv.id}
                      className={`inv-row${selected?.id === inv.id ? ' inv-row--selected' : ''}`}
                      onClick={() => setSelectedId(inv.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={checked.has(inv.id)} onChange={() => toggleCheck(inv.id)} />
                      </td>
                      <td>
                        <p className="inv-row__id">{displayInvoiceId(inv)}</p>
                      </td>
                      <td>
                        <p className="inv-row__sub">{patientLine(state, inv.patientId)}</p>
                      </td>
                      <td>{inv.concept}</td>
                      <td>{formatDocDate(inv.issuedAt)}</td>
                      <td style={st === 'vencida' ? { color: '#dc2626', fontWeight: 700 } : undefined}>
                        {inv.dueDate ? formatDocDate(inv.dueDate) : '—'}
                      </td>
                      <td style={{ fontWeight: 800 }}>{money(inv.amount)}</td>
                      <td>
                        <span className={`inv-badge ${statusBadgeClass(st)}`}>{statusLabel(st)}</span>
                      </td>
                      <td>
                        <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="inv-btn-ghost"
                            disabled={!inv.fileRef}
                            onClick={() => inv.fileRef && setPreviewInv(inv)}
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver PDF
                          </button>
                          <button
                            type="button"
                            className="inv-btn-ghost"
                            disabled={!inv.fileRef}
                            onClick={() => inv.fileRef && downloadDemoFileRef(inv.fileRef, inv.fileName)}
                          >
                            <Download className="h-3.5 w-3.5" /> Descargar
                          </button>
                          {st !== 'pagada' ? (
                            <button type="button" className="inv-btn-ghost" onClick={() => markPaid(inv)}>
                              Marcar pagada
                            </button>
                          ) : (
                            <button type="button" className="inv-btn-ghost" onClick={() => void sendToPatient(inv)}>
                              <Send className="h-3.5 w-3.5" /> Enviar
                            </button>
                          )}
                          {st === 'vencida' ? (
                            <button type="button" className="inv-btn-ghost" onClick={() => void sendReminder(inv)}>
                              Enviar recordatorio
                            </button>
                          ) : null}
                          <RowMenu onAction={(a) => handleRowAction(inv, a)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageItems.map((inv) => (
            <div
              key={`m-${inv.id}`}
              className={`inv-mobile-card${selected?.id === inv.id ? ' inv-row--selected' : ''}`}
              onClick={() => setSelectedId(inv.id)}
            >
              <p className="inv-row__id">{displayInvoiceId(inv)}</p>
              <p className="inv-row__sub">{patientLine(state, inv.patientId)}</p>
              <p>{money(inv.amount)} · {statusLabel(effectiveStatus(inv, today))}</p>
            </div>
          ))}
          <footer className="inv-card__foot">
            <span>
              Mostrando {from} a {to} de {filtered.length} factura{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="inv-pager">
              <button type="button" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </button>
              <span>{pageSafe}</span>
              <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)}>
                ›
              </button>
            </div>
          </footer>
        </section>

        <aside className="inv-side" ref={formRef}>
          <div className="inv-card inv-form">
            <h2>Nueva factura</h2>
            <div className="inv-form-grid">
              <InvPatientPicker
                patients={clinicPatients}
                patientId={form.patientId}
                onSelect={(id) => setForm({ ...form, patientId: id, appointmentId: '' })}
                state={state}
              />
              <div className="inv-field">
                <label>Cita vinculada</label>
                <select
                  value={form.appointmentId}
                  onChange={(e) => {
                    const appointmentId = e.target.value;
                    const concept = appointmentId
                      ? invoiceConceptFromAppointment(
                          state,
                          appointmentId,
                          clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos'
                        )
                      : clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos';
                    const appt = state.appointments.find((a) => a.id === appointmentId);
                    const price = appt
                      ? state.treatments.find((t) => t.id === appt.treatmentId)?.price ?? 80
                      : 80;
                    setForm({
                      ...form,
                      appointmentId,
                      concept,
                      lines: [{ ...emptyLine(vat), description: concept, unitPrice: price }]
                    });
                  }}
                >
                  <option value="">Sin cita vinculada</option>
                  {appts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} · {formatDocDate(a.date)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inv-field">
                <label>Concepto factura *</label>
                <input
                  value={form.concept}
                  onChange={(e) => setForm({ ...form, concept: e.target.value })}
                />
              </div>
              <div className="inv-lines">
                <h3>Conceptos</h3>
                {form.lines.map((line, idx) => (
                  <div key={idx} className="inv-line-row">
                    <input
                      placeholder="Descripción"
                      value={line.description}
                      onChange={(e) => {
                        const lines = [...form.lines];
                        lines[idx] = { ...line, description: e.target.value };
                        setForm({ ...form, lines });
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => {
                        const lines = [...form.lines];
                        lines[idx] = { ...line, quantity: Number(e.target.value) || 1 };
                        setForm({ ...form, lines });
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.unitPrice}
                      onChange={(e) => {
                        const lines = [...form.lines];
                        lines[idx] = { ...line, unitPrice: Number(e.target.value) || 0 };
                        setForm({ ...form, lines });
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      value={line.taxPercent}
                      onChange={(e) => {
                        const lines = [...form.lines];
                        lines[idx] = { ...line, taxPercent: Number(e.target.value) || 0 };
                        setForm({ ...form, lines });
                      }}
                    />
                    <span className="inv-line-total">{money(calcLineTotal(line))}</span>
                    {form.lines.length > 1 ? (
                      <button
                        type="button"
                        className="inv-btn-ghost"
                        aria-label="Quitar línea"
                        onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  className="inv-add-line"
                  onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine(vat)] })}
                >
                  + Añadir concepto
                </button>
              </div>
              <div className="inv-field">
                <label>Descuento</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="inv-totals">
                <p>
                  Subtotal: <strong>{money(totals.subtotal)}</strong>
                </p>
                <p>
                  IVA {vat}%: <strong>{money(totals.tax)}</strong>
                </p>
                <p>
                  Descuento: <strong>{money(form.discount)}</strong>
                </p>
                <p className="inv-totals__grand">
                  Total: <strong>{money(totals.total)}</strong>
                </p>
              </div>
              <div className="inv-form-grid inv-form-grid--2">
                <div className="inv-field">
                  <label>Emisión</label>
                  <input
                    type="date"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                  />
                </div>
                <div className="inv-field">
                  <label>Vencimiento</label>
                  <input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-field">
                <label>Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagada">Pagada</option>
                  <option value="vencida">Vencida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div className="inv-switch-row">
                <div>
                  <p>Publicar en portal del paciente</p>
                  <small>El paciente podrá consultar y descargar la factura.</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.portalVisible}
                  className={`inv-switch${form.portalVisible ? ' inv-switch--on' : ''}`}
                  onClick={() => setForm({ ...form, portalVisible: !form.portalVisible })}
                />
              </div>
              <div className="inv-switch-row">
                <div>
                  <p>Notificar al paciente</p>
                  <small>Enviar aviso por email o app.</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.notify}
                  className={`inv-switch${form.notify ? ' inv-switch--on' : ''}`}
                  onClick={() => setForm({ ...form, notify: !form.notify })}
                />
              </div>
              <div className="inv-pdf-section">
                <h3>Factura PDF</h3>
                <div className="inv-radio-row">
                  <label>
                    <input
                      type="radio"
                      name="pdfMode"
                      checked={pdfMode === 'upload'}
                      onChange={() => setPdfMode('upload')}
                    />{' '}
                    Subir PDF manualmente
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="pdfMode"
                      checked={pdfMode === 'auto'}
                      onChange={() => {
                        setPdfMode('auto');
                        setAutoPdf(true);
                        setPdfFile(null);
                      }}
                    />{' '}
                    Generar PDF automático
                  </label>
                </div>
                {pdfMode === 'upload' ? (
                  <div
                    className={`inv-dropzone${dragOver ? ' inv-dropzone--drag' : ''}${uploadError ? ' inv-dropzone--error' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      pickPdf(e.dataTransfer.files[0] ?? null);
                    }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="mx-auto h-5 w-5 text-teal-600" />
                    <p>Arrastra un PDF aquí o haz clic para seleccionar</p>
                    <small>PDF · Máx. 10 MB</small>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
                    />
                  </div>
                ) : null}
                {uploadError ? <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>{uploadError}</p> : null}
                {pdfFile ? (
                  <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {pdfFile.name} · {uploadPct}%
                  </p>
                ) : null}
                <label style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', fontSize: '0.78rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={autoPdf}
                    onChange={(e) => {
                      setAutoPdf(e.target.checked);
                      if (e.target.checked) {
                        setPdfFile(null);
                        setPdfMode('auto');
                      }
                    }}
                  />
                  Generar PDF automático si no subes archivo
                </label>
              </div>
              <button
                type="button"
                className="inv-btn-primary"
                style={{ width: '100%' }}
                disabled={saving}
                onClick={() => void createInvoicePdf()}
              >
                Crear factura PDF
              </button>
            </div>
          </div>

          {selected ? (
            <div className="inv-card inv-preview-card">
              <h3>Vista previa</h3>
              <div className="inv-preview-card__thumb">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                Factura seleccionada: <strong style={{ color: '#0f2742' }}>{displayInvoiceId(selected)}</strong>
              </p>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                Paciente: <strong style={{ color: '#0f2742' }}>{patientName(state, selected.patientId)}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2742' }}>Total: {money(selected.amount)}</p>
              <p>
                {selected.fileRef ? <span className="inv-badge inv-badge--pdf">PDF</span> : null}{' '}
                <span className={`inv-badge ${statusBadgeClass(effectiveStatus(selected, today))}`}>
                  {statusLabel(effectiveStatus(selected, today))}
                </span>
              </p>
              <div className="inv-preview-card__actions">
                <button
                  type="button"
                  disabled={!selected.fileRef}
                  onClick={() => selected.fileRef && downloadDemoFileRef(selected.fileRef, selected.fileName)}
                >
                  Descargar
                </button>
                <button type="button" onClick={() => void sendToPatient(selected)}>
                  Enviar al paciente
                </button>
                {effectiveStatus(selected, today) !== 'pagada' ? (
                  <button type="button" className="inv-btn-primary" onClick={() => markPaid(selected)}>
                    Marcar pagada
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="inv-util-grid">
        <div className="inv-util-card inv-util-card--teal">
          <h3>Automatiza tu facturación</h3>
          <p>Configura series, IVA y plantillas PDF desde ajustes de clínica.</p>
          <button
            type="button"
            className="inv-btn-secondary"
            onClick={() => {
              window.location.href = '/admin/configuracion';
            }}
          >
            Configurar automatización
          </button>
        </div>
        <div className="inv-util-card">
          <h3>Recordatorios</h3>
          {reminders.overdue.length ? (
            <div className="inv-reminder-item">
              <span style={{ color: '#dc2626' }}>{reminders.overdue.length} factura(s) vencida(s)</span>
              <button type="button" onClick={() => void sendReminder(reminders.overdue[0])}>
                Enviar recordatorio
              </button>
            </div>
          ) : null}
          {reminders.soon.length ? (
            <div className="inv-reminder-item">
              <span style={{ color: '#c2410c' }}>{reminders.soon.length} factura(s) próximas a vencer</span>
              <button type="button" onClick={() => void sendReminder(reminders.soon[0])}>
                Enviar recordatorio
              </button>
            </div>
          ) : null}
          {!reminders.overdue.length && !reminders.soon.length ? (
            <p>No hay recordatorios pendientes.</p>
          ) : null}
        </div>
      </div>

      {previewInv?.fileRef ? (
        <Modal open title={displayInvoiceId(previewInv)} onClose={() => setPreviewInv(null)}>
          <div className="inv-preview-modal">
            <iframe title="PDF" src={resolveDemoFileUrl(previewInv.fileRef) ?? ''} />
          </div>
        </Modal>
      ) : null}

      {editInv ? (
        <Modal open title="Editar factura" onClose={() => setEditInv(null)}>
          <div className="grid gap-3">
            <Field label="Concepto *">
              <Input value={editInv.concept} onChange={(e) => setEditInv({ ...editInv, concept: e.target.value })} />
            </Field>
            <Field label="Importe *">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={editInv.amount}
                onChange={(e) => setEditInv({ ...editInv, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Estado">
              <Select
                value={editInv.status}
                onChange={(e) => setEditInv({ ...editInv, status: e.target.value as InvoiceStatus })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </Field>
            <Field label="Vencimiento">
              <Input
                type="date"
                value={editInv.dueDate ?? ''}
                onChange={(e) => setEditInv({ ...editInv, dueDate: e.target.value })}
              />
            </Field>
            <button
              type="button"
              className="inv-btn-primary"
              onClick={() => {
                if (!editInv.concept.trim()) {
                  setNotice({ type: 'error', message: 'Introduce un concepto de factura.' });
                  return;
                }
                if (editInv.amount <= 0) {
                  setNotice({ type: 'error', message: 'El importe debe ser mayor que 0.' });
                  return;
                }
                updateInvoice(editInv, {
                  concept: editInv.concept.trim(),
                  amount: editInv.amount,
                  status: editInv.status,
                  dueDate: editInv.dueDate
                });
                setEditInv(null);
                setNotice({ type: 'ok', message: 'Factura actualizada.' });
              }}
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      ) : null}

      {deleteId ? (
        <Modal open title="Eliminar factura" onClose={() => setDeleteId(null)}>
          <p style={{ fontWeight: 600, color: '#475569' }}>¿Eliminar esta factura? No se puede deshacer.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="inv-btn-secondary" onClick={() => setDeleteId(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="inv-btn-primary"
              style={{ background: '#dc2626' }}
              onClick={() => {
                commit(deleteInvoice(state, deleteId));
                setDeleteId(null);
                if (selectedId === deleteId) setSelectedId(null);
                setNotice({ type: 'ok', message: 'Factura eliminada.' });
              }}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
