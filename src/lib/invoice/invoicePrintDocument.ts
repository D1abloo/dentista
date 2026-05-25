import type { AppSettings, DemoState, Invoice, InvoiceLine, InvoiceStatus, Patient, Payment, PaymentMethod } from '@/types/demo';
import { money } from '@/lib/format';
import { resolveDemoFileUrl } from '@/lib/demoFiles';
import {
  calcInvoiceTotals,
  displayInvoiceId,
  effectiveStatus,
  formatDocDate,
  formatNhcDisplay,
  statusLabel
} from '@/lib/invoiceAdmin';
import { INVOICE_PRINT_STYLES } from '@/lib/invoice/invoicePrintLayout';

export type InvoicePrintLine = {
  concept: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
};

export type InvoicePrintPayment = {
  methodLabel: string;
  amountLabel: string;
  paidAtLabel: string;
  reference: string;
};

export type InvoicePrintPayload = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  statusLabel: string;
  clinicLogoUrl: string;
  clinicName: string;
  clinicTagline: string;
  clinicLegalName: string;
  clinicCommercialName: string;
  clinicTaxId: string;
  clinicAddressLines: string[];
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  patientName: string;
  patientNhc: string;
  patientDni: string;
  patientAddress: string;
  patientPhone: string;
  patientEmail: string;
  appointmentHtml: string;
  lines: InvoicePrintLine[];
  subtotal: number;
  discount: number;
  taxableBase: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  payments: InvoicePrintPayment[];
  notes: string;
  professionalName: string;
  professionalSpecialty: string;
  professionalLicense: string;
  professionalSignatureHtml: string;
  generatedAt: string;
  fiscalIncomplete: boolean;
  licensePending: boolean;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paymentMethodLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    efectivo: 'Efectivo',
    seguro: 'Seguro',
    otro: 'Otro'
  };
  return map[method] ?? 'Otro';
}

function statusClass(status: InvoiceStatus) {
  return `inv-print__status inv-print__status--${status}`;
}

function buildAddressLines(settings: AppSettings): string[] {
  const lines: string[] = [];
  const line1 = settings.address?.trim();
  const line2 = settings.addressLine2?.trim();
  if (line1) lines.push(line1);
  if (line2) lines.push(line2);
  const cityParts = [settings.postalCode, settings.city, settings.province].filter(Boolean).join(' ');
  if (cityParts) lines.push(cityParts);
  if (settings.country?.trim()) lines.push(settings.country.trim());
  return lines;
}

function fiscalIncomplete(settings: AppSettings): boolean {
  return !settings.nif?.trim() || !settings.legalName?.trim() || !settings.address?.trim();
}

function invoiceLinesFromInvoice(invoice: Invoice, vatRate: number): InvoiceLine[] {
  if (invoice.lines?.length) return invoice.lines;
  return [
    {
      description: invoice.concept,
      quantity: 1,
      unitPrice: invoice.amount / (1 + vatRate / 100),
      taxPercent: vatRate
    }
  ];
}

function mapPrintLines(lines: InvoiceLine[]): InvoicePrintLine[] {
  return lines.map((l) => {
    const base = l.quantity * l.unitPrice;
    const tax = base * (l.taxPercent / 100);
    return {
      concept: l.description,
      description: l.detail?.trim() ?? '',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxPercent,
      total: base + tax
    };
  });
}

function professionalHonorific(visibleTitle?: string, fullName?: string): string {
  const t = visibleTitle?.trim();
  if (t) return t;
  const lower = (fullName ?? '').toLowerCase();
  if (/\b(maría|maria|ana|elena|laura|carmen|dra)\b/.test(lower)) return 'Dra.';
  return 'Dr.';
}

export function resolveInvoicePrintPayload(
  state: DemoState,
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings,
  today = new Date().toISOString().slice(0, 10)
): InvoicePrintPayload {
  const status = effectiveStatus(invoice, today);
  const vatRate = settings.vatRate ?? 21;
  const rawLines = invoiceLinesFromInvoice(invoice, vatRate);
  const totals = calcInvoiceTotals(rawLines, invoice.discount ?? 0);
  const taxableBase = Math.max(0, totals.subtotal - totals.discount);
  const paidPayments = state.payments.filter(
    (p) => p.invoiceId === invoice.id && p.status === 'completado'
  );
  const paidAmount = paidPayments.reduce((s, p) => s + p.amount, 0);
  const pendingAmount = Math.max(0, totals.total - paidAmount);

  const appt = invoice.appointmentId ? state.appointments.find((a) => a.id === invoice.appointmentId) : undefined;
  const clinic = appt
    ? state.clinics.find((c) => c.id === appt.clinicId)
    : state.clinics.find((c) => c.tenantId === invoice.tenantId);

  const dentistId = invoice.professionalId ?? appt?.dentistId ?? patient.primaryDentistId;
  const dentist = dentistId ? state.dentists.find((d) => d.id === dentistId) : undefined;

  let appointmentHtml = '<p>Factura sin cita vinculada</p>';
  if (appt) {
    const treatment = state.treatments.find((t) => t.id === appt.treatmentId);
    const branch = clinic?.name ?? '—';
    const prof = dentist?.fullName ?? '—';
    const date = appt.date?.slice(0, 10) ?? '—';
    const time = appt.time ?? '—';
    appointmentHtml = `
      <dl>
        <dt>Fecha</dt><dd>${escapeHtml(formatDocDate(date))}</dd>
        <dt>Hora</dt><dd>${escapeHtml(time)}</dd>
        <dt>Tratamiento</dt><dd>${escapeHtml(treatment?.name ?? '—')}</dd>
        <dt>Profesional</dt><dd>${escapeHtml(prof)}</dd>
        <dt>Sede</dt><dd>${escapeHtml(branch)}</dd>
      </dl>`;
  }

  const sigRef = dentist?.signatureRef;
  const sigUrl = sigRef ? resolveDemoFileUrl(sigRef) ?? sigRef : null;
  const professionalSignatureHtml =
    sigUrl && (sigUrl.startsWith('data:') || sigUrl.startsWith('/') || sigUrl.startsWith('http'))
      ? `<img src="${escapeHtml(sigUrl)}" alt="Firma del profesional" />`
      : '';

  const license = dentist?.collegiateNumber?.trim();
  const licensePending = !license;

  let professionalName = 'Profesional no asignado';
  let professionalSpecialty = '';
  if (dentist) {
    professionalName = `${professionalHonorific(dentist.visibleTitle, dentist.fullName)} ${dentist.fullName}`;
    professionalSpecialty = dentist.specialty ?? dentist.visibleTitle ?? '';
  }

  const logoUrl =
    settings.logoUrl?.trim() ||
    clinic?.imageUrl?.trim() ||
    '/img/logo.webp';

  const payments: InvoicePrintPayment[] = paidPayments.map((p: Payment) => ({
    methodLabel: paymentMethodLabel(p.method),
    amountLabel: money(p.amount),
    paidAtLabel: p.paidAt ? formatDocDate(p.paidAt) : '—',
    reference: p.id
  }));

  const patientAddress = [patient.address, patient.postalCode, patient.city].filter(Boolean).join(', ');

  return {
    invoiceNumber: displayInvoiceId(invoice),
    invoiceDate: formatDocDate(invoice.issuedAt),
    dueDate: invoice.dueDate ? formatDocDate(invoice.dueDate) : '—',
    status,
    statusLabel: statusLabel(status),
    clinicLogoUrl: logoUrl,
    clinicName: settings.clinicName || clinic?.name || 'Clínica',
    clinicTagline: settings.tagline?.trim() ?? '',
    clinicLegalName: settings.legalName?.trim() || settings.clinicName,
    clinicCommercialName: settings.commercialName?.trim() ?? '',
    clinicTaxId: settings.nif?.trim() ?? '—',
    clinicAddressLines: buildAddressLines(settings),
    clinicPhone: settings.phone?.trim() ?? clinic?.phone ?? '',
    clinicEmail: settings.email?.trim() ?? clinic?.email ?? '',
    clinicWebsite: settings.website?.trim() ?? '',
    patientName: patient.fullName,
    patientNhc: formatNhcDisplay(patient.nhc),
    patientDni: patient.dni?.trim() ?? '',
    patientAddress,
    patientPhone: patient.phone?.trim() ?? '',
    patientEmail: patient.email?.trim() ?? '',
    appointmentHtml,
    lines: mapPrintLines(rawLines),
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxableBase,
    taxTotal: totals.tax,
    total: totals.total,
    paidAmount,
    pendingAmount,
    payments,
    notes: invoice.notes?.trim() ?? '',
    professionalName,
    professionalSpecialty,
    professionalLicense: license ?? 'pendiente',
    professionalSignatureHtml,
    generatedAt: formatDocDate(new Date().toISOString()),
    fiscalIncomplete: fiscalIncomplete(settings),
    licensePending
  };
}

function renderLinesTable(lines: InvoicePrintLine[]): string {
  const rows = lines
    .map(
      (l) => `
    <tr>
      <td><strong>${escapeHtml(l.concept)}</strong>${l.description ? `<div class="muted">${escapeHtml(l.description)}</div>` : ''}</td>
      <td>${l.description ? escapeHtml(l.description) : '—'}</td>
      <td class="num">${l.quantity}</td>
      <td class="num">${escapeHtml(money(l.unitPrice))}</td>
      <td class="num">${l.taxRate}%</td>
      <td class="num"><strong>${escapeHtml(money(l.total))}</strong></td>
    </tr>`
    )
    .join('');
  return `
    <div class="inv-print__table-wrap">
      <table class="inv-print__table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Descripción</th>
            <th class="num">Cantidad</th>
            <th class="num">Precio unitario</th>
            <th class="num">IVA</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPayments(payload: InvoicePrintPayload): string {
  if (!payload.payments.length) {
    return `<div class="inv-print__payment"><h2>Información de pago</h2><p>No hay pagos registrados para esta factura.</p></div>`;
  }
  const items = payload.payments
    .map(
      (p) =>
        `<li><strong>${escapeHtml(p.methodLabel)}</strong> · ${escapeHtml(p.amountLabel)} · ${escapeHtml(p.paidAtLabel)}${p.reference ? ` · Ref: ${escapeHtml(p.reference)}` : ''}</li>`
    )
    .join('');
  return `
    <div class="inv-print__payment">
      <h2>Información de pago</h2>
      <ul>${items}</ul>
      <p><strong>Importe pagado:</strong> ${escapeHtml(money(payload.paidAmount))}</p>
      <p><strong>Saldo pendiente:</strong> ${escapeHtml(money(payload.pendingAmount))}</p>
    </div>`;
}

export function buildInvoicePrintHtml(payload: InvoicePrintPayload, opts?: { showToolbar?: boolean }): string {
  const showToolbar = opts?.showToolbar ?? typeof window !== 'undefined';

  const clinicLines = payload.clinicAddressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('');
  const clinicBlock = `
    <p><strong>${escapeHtml(payload.clinicLegalName)}</strong></p>
    ${payload.clinicCommercialName ? `<p>${escapeHtml(payload.clinicCommercialName)}</p>` : ''}
    <p>CIF/NIF: ${escapeHtml(payload.clinicTaxId)}</p>
    ${clinicLines}
    ${payload.clinicPhone ? `<p>Tel: ${escapeHtml(payload.clinicPhone)}</p>` : ''}
    ${payload.clinicEmail ? `<p>Email: ${escapeHtml(payload.clinicEmail)}</p>` : ''}
    ${payload.clinicWebsite ? `<p>${escapeHtml(payload.clinicWebsite)}</p>` : ''}`;

  const patientBlock = `
    <p><strong>${escapeHtml(payload.patientName)}</strong></p>
    <p>${escapeHtml(payload.patientNhc)}</p>
    ${payload.patientDni ? `<p>DNI/NIE: ${escapeHtml(payload.patientDni)}</p>` : ''}
    ${payload.patientAddress ? `<p>${escapeHtml(payload.patientAddress)}</p>` : ''}
    ${payload.patientPhone ? `<p>Tel: ${escapeHtml(payload.patientPhone)}</p>` : ''}
    ${payload.patientEmail ? `<p>Email: ${escapeHtml(payload.patientEmail)}</p>` : ''}`;

  const paidBadge =
    payload.status === 'pagada'
      ? '<span class="inv-print__badge-paid">Factura pagada</span>'
      : payload.status === 'pendiente' || payload.status === 'vencida'
        ? '<span class="inv-print__badge-pending">Pago pendiente</span>'
        : '';

  const notesBlock = payload.notes.trim()
    ? `<div class="inv-print__notes"><h2>Notas</h2><p>${escapeHtml(payload.notes)}</p></div>`
    : '';

  const proLicense =
    payload.professionalLicense === 'pendiente'
      ? 'Nº colegiado: pendiente'
      : `Nº colegiado: ${escapeHtml(payload.professionalLicense)}`;

  const toolbar = showToolbar
    ? `<div class="inv-print__toolbar no-print">
        <span>Vista de factura AgendaClinic</span>
        <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
        <button type="button" class="secondary" onclick="window.close()">Cerrar</button>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Factura ${escapeHtml(payload.invoiceNumber)} · AgendaClinic</title>
  <style>${INVOICE_PRINT_STYLES}</style>
</head>
<body>
  <div class="inv-print">
    ${toolbar}
    <header class="inv-print__header">
      <div class="inv-print__brand">
        <img src="${escapeHtml(payload.clinicLogoUrl)}" alt="Logo de la clínica" onerror="this.src='/img/logo.webp'" />
        <h1>${escapeHtml(payload.clinicName)}</h1>
        ${payload.clinicTagline ? `<p>${escapeHtml(payload.clinicTagline)}</p>` : ''}
      </div>
      <div class="inv-print__title-block">
        <h1 class="inv-print__title">Factura</h1>
        <ul class="inv-print__meta">
          <li><strong>Nº factura:</strong> ${escapeHtml(payload.invoiceNumber)}</li>
          <li><strong>Fecha:</strong> ${escapeHtml(payload.invoiceDate)}</li>
          <li><strong>Vencimiento:</strong> ${escapeHtml(payload.dueDate)}</li>
          <li><strong>Estado:</strong> <span class="${statusClass(payload.status)}">${escapeHtml(payload.statusLabel)}</span></li>
        </ul>
      </div>
    </header>

    <div class="inv-print__grid2">
      <section class="inv-print__block">
        <h2>Datos de la clínica</h2>
        ${clinicBlock}
      </section>
      <section class="inv-print__block">
        <h2>Datos del paciente</h2>
        ${patientBlock}
      </section>
    </div>

    <section class="inv-print__context">
      <h2>Cita vinculada</h2>
      ${payload.appointmentHtml}
    </section>

    ${renderLinesTable(payload.lines)}

    <div class="inv-print__totals-wrap">
      <div class="inv-print__totals">
        <dl>
          <div class="inv-print__totals-row"><dt>Subtotal</dt><dd>${escapeHtml(money(payload.subtotal))}</dd></div>
          ${payload.discount > 0 ? `<div class="inv-print__totals-row inv-print__totals-row--discount"><dt>Descuento</dt><dd>-${escapeHtml(money(payload.discount))}</dd></div>` : ''}
          <div class="inv-print__totals-row"><dt>Base imponible</dt><dd>${escapeHtml(money(payload.taxableBase))}</dd></div>
          <div class="inv-print__totals-row"><dt>IVA</dt><dd>${escapeHtml(money(payload.taxTotal))}</dd></div>
          <div class="inv-print__totals-row inv-print__totals-row--total"><dt>Total</dt><dd>${escapeHtml(money(payload.total))}</dd></div>
          <div class="inv-print__totals-row"><dt>Pagado</dt><dd>${escapeHtml(money(payload.paidAmount))}</dd></div>
          <div class="inv-print__totals-row"><dt>Pendiente</dt><dd>${escapeHtml(money(payload.pendingAmount))}</dd></div>
        </dl>
        ${paidBadge}
      </div>
    </div>

    ${renderPayments(payload)}
    ${notesBlock}

    <p class="inv-print__legal">
      Documento generado automáticamente por AgendaClinic.<br />
      Esta factura corresponde a servicios sanitarios prestados por la clínica indicada.
    </p>

    <div class="inv-print__footer-zone">
      <section class="inv-print__pro">
        <h2>Profesional responsable</h2>
        ${payload.professionalSignatureHtml}
        <p>${escapeHtml(payload.professionalName)}</p>
        ${payload.professionalSpecialty ? `<p class="muted">${escapeHtml(payload.professionalSpecialty)}</p>` : ''}
        <p class="muted">${proLicense}</p>
      </section>
    </div>
  </div>

  <footer class="inv-print__page-footer">
    <span>AgendaClinic</span>
    <span>Factura generada el ${escapeHtml(payload.generatedAt)}</span>
    <span>Página <span class="pageNumber"></span></span>
  </footer>
  <script>
    /* Numeración de páginas en impresión (soporte limitado en algunos navegadores) */
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeprint', function() {
        document.querySelectorAll('.pageNumber').forEach(function(el) {
          el.textContent = '1';
        });
      });
    }
  </script>
</body>
</html>`;
}

export function buildInvoicePrintHtmlFromState(
  state: DemoState,
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings
): string {
  return buildInvoicePrintHtml(resolveInvoicePrintPayload(state, invoice, patient, settings));
}
