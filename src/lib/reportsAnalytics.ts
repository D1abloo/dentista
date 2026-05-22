import { appointmentPrice } from '@/lib/appointments';
import { effectiveStatus } from '@/lib/invoiceAdmin';
import type { Appointment, AppointmentStatus, DemoState, Invoice } from '@/types/demo';

export type ReportRangeId = '7' | '30' | '90' | 'month';

export type ReportFilters = {
  rangeId: ReportRangeId;
  clinicId: string;
  dentistId: string;
};

const STATUS_ORDER: AppointmentStatus[] = [
  'pendiente',
  'confirmada',
  'completada',
  'cancelada',
  'no_asistio'
];

export const STATUS_CHART_COLORS: Record<AppointmentStatus, string> = {
  pendiente: '#3b82f6',
  confirmada: '#22c55e',
  completada: '#2d8b7d',
  cancelada: '#f97316',
  no_asistio: '#ef4444',
  reprogramada: '#94a3b8'
};

export const RANGE_OPTIONS: { id: ReportRangeId; label: string }[] = [
  { id: '7', label: 'Últimos 7 días' },
  { id: '30', label: 'Últimos 30 días' },
  { id: '90', label: 'Últimos 90 días' },
  { id: 'month', label: 'Este mes' }
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export function resolveDateRange(rangeId: ReportRangeId, today = new Date()): { start: string; end: string; label: string } {
  const end = today.toISOString().slice(0, 10);
  const d = new Date(today);
  if (rangeId === 'month') {
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    return { start, end, label: 'Este mes' };
  }
  const days = rangeId === '7' ? 7 : rangeId === '90' ? 90 : 30;
  d.setDate(d.getDate() - (days - 1));
  const start = d.toISOString().slice(0, 10);
  const opt = RANGE_OPTIONS.find((r) => r.id === rangeId);
  return { start, end, label: opt?.label ?? 'Periodo' };
}

export function previousRange(start: string, end: string): { start: string; end: string } {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  const len = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (len - 1));
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10)
  };
}

function inRange(iso: string, start: string, end: string) {
  const day = iso.slice(0, 10);
  return day >= start && day <= end;
}

function filterAppointments(
  state: DemoState,
  appointments: Appointment[],
  start: string,
  end: string,
  clinicId: string,
  dentistId: string
) {
  return appointments.filter(
    (a) =>
      inRange(a.date, start, end) &&
      (!clinicId || a.clinicId === clinicId) &&
      (!dentistId || a.dentistId === dentistId)
  );
}

function filterPayments(state: DemoState, tenantId: string, start: string, end: string, clinicId: string) {
  return state.payments.filter((p) => {
    if (p.tenantId !== tenantId || p.status !== 'completado') return false;
    const day = (p.paidAt ?? p.createdAt).slice(0, 10);
    if (!inRange(day, start, end)) return false;
    if (!clinicId) return true;
    const patient = state.patients.find((x) => x.id === p.patientId);
    return patient?.preferredClinicId === clinicId;
  });
}

function filterInvoices(invoices: Invoice[], start: string, end: string) {
  return invoices.filter((i) => inRange(i.issuedAt, start, end));
}

function incomeForPeriod(
  state: DemoState,
  appointments: Appointment[],
  payments: ReturnType<typeof filterPayments>,
  invoices: Invoice[]
) {
  const paySum = payments.reduce((s, p) => s + p.amount, 0);
  if (paySum > 0) return paySum;
  const invSum = invoices
    .filter((i) => i.status === 'pagada')
    .reduce((s, i) => s + i.amount, 0);
  if (invSum > 0) return invSum;
  return appointments
    .filter((a) => a.status === 'completada')
    .reduce((s, a) => s + appointmentPrice(state, a.treatmentId), 0);
}

function attendanceRate(appointments: Appointment[]) {
  const relevant = appointments.filter((a) => !['cancelada', 'reprogramada'].includes(a.status));
  if (!relevant.length) return 0;
  const ok = relevant.filter((a) => a.status === 'completada' || a.status === 'confirmada').length;
  return Math.round((ok / relevant.length) * 100);
}

function trendText(current: number, previous: number, suffix = 'vs mes anterior') {
  if (previous === 0 && current === 0) return `— sin cambio ${suffix}`;
  if (previous === 0) return `▲ +100% ${suffix}`;
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return `— sin cambio ${suffix}`;
  return `${delta > 0 ? '▲' : '▼'} ${delta > 0 ? '+' : ''}${delta}% ${suffix}`;
}

function trendDelta(current: number, previous: number, suffix = 'vs mes anterior') {
  const d = current - previous;
  if (d === 0) return `— sin cambio ${suffix}`;
  return `${d > 0 ? '▲' : '▼'} ${d > 0 ? '+' : ''}${d} ${suffix}`;
}

function sparkBuckets(values: number[], points = 8): number[] {
  if (!values.length) return Array(points).fill(0);
  const chunk = Math.max(1, Math.ceil(values.length / points));
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const slice = values.slice(i * chunk, (i + 1) * chunk);
    out.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0);
  }
  return out;
}

export type ReportsBundle = ReturnType<typeof buildReportsAnalytics>;

export function buildReportsAnalytics(
  state: DemoState,
  tenantId: string,
  appointments: Appointment[],
  invoices: Invoice[],
  filters: ReportFilters,
  today = new Date()
) {
  const { start, end, label: rangeLabel } = resolveDateRange(filters.rangeId, today);
  const prev = previousRange(start, end);

  const appts = filterAppointments(state, appointments, start, end, filters.clinicId, filters.dentistId);
  const apptsPrev = filterAppointments(state, appointments, prev.start, prev.end, filters.clinicId, filters.dentistId);
  const payments = filterPayments(state, tenantId, start, end, filters.clinicId);
  const paymentsPrev = filterPayments(state, tenantId, prev.start, prev.end, filters.clinicId);
  const invPeriod = filterInvoices(invoices, start, end);
  const invPrev = filterInvoices(invoices, prev.start, prev.end);

  const income = incomeForPeriod(state, appts, payments, invPeriod);
  const incomePrev = incomeForPeriod(state, apptsPrev, paymentsPrev, invPrev);

  const pendingInvoices = invoices.filter(
    (i) =>
      effectiveStatus(i, end) === 'pendiente' &&
      (!filters.clinicId ||
        state.patients.find((p) => p.id === i.patientId)?.preferredClinicId === filters.clinicId)
  );
  const pendingPrev = invoices.filter((i) => effectiveStatus(i, prev.end) === 'pendiente');

  const newPatients = state.patients.filter((p) => {
    if (!inRange(p.createdAt, start, end)) return false;
    if (filters.clinicId && p.preferredClinicId !== filters.clinicId) return false;
    return true;
  });
  const newPatientsPrev = state.patients.filter((p) => inRange(p.createdAt, prev.start, prev.end));

  const treatmentCounts = new Map<string, number>();
  for (const a of appts) {
    treatmentCounts.set(a.treatmentId, (treatmentCounts.get(a.treatmentId) ?? 0) + 1);
  }
  const topTreatments = [...treatmentCounts.entries()]
    .map(([id, count]) => ({
      id,
      name: state.treatments.find((t) => t.id === id)?.name ?? id,
      count,
      pct: appts.length ? Math.round((count / appts.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const top = topTreatments[0];

  const byStatus = STATUS_ORDER.map((status) => {
    const count = appts.filter((a) => a.status === status).length;
    return {
      status,
      count,
      pct: appts.length ? Math.round((count / appts.length) * 100) : 0
    };
  }).filter((x) => x.count > 0 || appts.length === 0);

  const attendance = attendanceRate(appts);
  const attendancePrev = attendanceRate(apptsPrev);

  const dailyIncome: { key: string; label: string; amount: number }[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const endD = new Date(`${end}T12:00:00`);
  while (cursor <= endD) {
    const key = cursor.toISOString().slice(0, 10);
    const dayAppts = appts.filter((a) => a.date === key);
    const dayPay = payments.filter((p) => (p.paidAt ?? p.createdAt).slice(0, 10) === key);
    const amount =
      dayPay.reduce((s, p) => s + p.amount, 0) ||
      dayAppts
        .filter((a) => a.status === 'completada')
        .reduce((s, a) => s + appointmentPrice(state, a.treatmentId), 0);
    dailyIncome.push({
      key,
      label: cursor
        .toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        .replace('.', ''),
      amount
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  function aggregateIncome(mode: 'day' | 'week' | 'month') {
    if (mode === 'day') return dailyIncome.map((d) => ({ label: d.label, amount: d.amount, tooltip: d.label }));
    if (mode === 'month') {
      const map = new Map<string, number>();
      for (const d of dailyIncome) {
        const m = d.key.slice(0, 7);
        map.set(m, (map.get(m) ?? 0) + d.amount);
      }
      return [...map.entries()].map(([k, amount]) => ({
        label: k,
        amount,
        tooltip: k
      }));
    }
    const weeks: { label: string; amount: number; tooltip: string }[] = [];
    for (let i = 0; i < dailyIncome.length; i += 7) {
      const chunk = dailyIncome.slice(i, i + 7);
      if (!chunk.length) continue;
      const amount = chunk.reduce((s, c) => s + c.amount, 0);
      const a = chunk[0];
      const b = chunk[chunk.length - 1];
      weeks.push({
        label: a.label,
        amount,
        tooltip: `${a.label} – ${b.label}`
      });
    }
    return weeks.length ? weeks : [{ label: '—', amount: 0, tooltip: '—' }];
  }

  const weekdayOcc = WEEKDAYS.map((label, idx) => {
    const dayAppts = appts.filter((a) => new Date(`${a.date}T12:00:00`).getDay() === idx);
    const cap = 12;
    const pct = Math.min(100, Math.round((dayAppts.length / cap) * 100));
    return { label, pct, count: dayAppts.length };
  });

  const dentists = state.dentists.filter((d) => d.tenantId === tenantId && d.active);
  const dentistRows: {
    id: string;
    name: string;
    appointments: number;
    income: number;
    attendance: number;
    spark: number[];
  }[] = dentists
    .filter((d) => !filters.dentistId || filters.dentistId === d.id)
    .map((d) => {
      const dAppts = appts.filter((a) => a.dentistId === d.id);
      const dPay = payments.filter((p) => {
        const ap = appts.find((a) => a.patientId === p.patientId);
        return ap?.dentistId === d.id;
      });
      const ing =
        dPay.reduce((s, p) => s + p.amount, 0) ||
        dAppts
          .filter((a) => a.status === 'completada')
          .reduce((s, a) => s + appointmentPrice(state, a.treatmentId), 0);
      return {
        id: d.id,
        name: d.fullName,
        appointments: dAppts.length,
        income: ing,
        attendance: attendanceRate(dAppts),
        spark: sparkBuckets(
          dAppts.map((a) => appointmentPrice(state, a.treatmentId)),
          6
        )
      };
    })
    .sort((a, b) => b.income - a.income);

  const billingIssued = invPeriod.length;
  const billingPaid = invPeriod.filter((i) => i.status === 'pagada').length;
  const billingPending = invPeriod.filter((i) => effectiveStatus(i, end) === 'pendiente').length;
  const billingOverdue = invPeriod.filter((i) => effectiveStatus(i, end) === 'vencida').length;
  const billingTotal = invPeriod.reduce((s, i) => s + i.amount, 0);
  const billingDonut = [
    { name: 'Pagadas', value: billingPaid, color: '#22c55e' },
    { name: 'Pendientes', value: billingPending, color: '#f97316' },
    { name: 'Vencidas', value: billingOverdue, color: '#ef4444' }
  ].filter((x) => x.value > 0);

  const insights: { tone: 'orange' | 'green' | 'teal' | 'red'; text: string }[] = [];
  if (pendingInvoices.length) {
    insights.push({
      tone: 'orange',
      text: `Tienes ${pendingInvoices.length} factura${pendingInvoices.length === 1 ? '' : 's'} pendiente${pendingInvoices.length === 1 ? '' : 's'} de cobro.`
    });
  }
  const thu = weekdayOcc.find((w) => w.label === 'Jue');
  if (thu && thu.pct >= 90) {
    insights.push({ tone: 'green', text: 'La ocupación del jueves supera el 90%.' });
  }
  if (top) {
    const short = top.name.split(' ').slice(0, 2).join(' ');
    insights.push({
      tone: 'teal',
      text: `${short} es el tratamiento más reservado.`
    });
  }
  const noShow = appts.filter((a) => a.status === 'no_asistio').length;
  if (noShow) {
    insights.push({
      tone: 'red',
      text: `${noShow} paciente${noShow === 1 ? '' : 's'} no asistió en este periodo.`
    });
  }

  const hasData = appts.length > 0 || income > 0 || payments.length > 0;

  return {
    rangeLabel,
    start,
    end,
    hasData,
    kpis: {
      income,
      incomeTrend: trendText(income, incomePrev),
      incomeSpark: sparkBuckets(dailyIncome.map((d) => d.amount)),
      appointments: appts.length,
      appointmentsTrend: trendText(appts.length, apptsPrev.length),
      appointmentsSpark: sparkBuckets(dailyIncome.map((d) => appts.filter((a) => a.date === d.key).length)),
      attendance,
      attendanceTrend: trendText(attendance, attendancePrev, 'vs mes anterior').replace('%', '%').replace('▲ +', '▲ +'),
      attendanceSpark: sparkBuckets([attendance, attendancePrev, attendance]),
      pendingInvoices: pendingInvoices.length,
      pendingTrend: trendDelta(pendingInvoices.length, pendingPrev.length),
      pendingSpark: sparkBuckets([pendingInvoices.length, pendingPrev.length]),
      newPatients: newPatients.length,
      newPatientsTrend: trendDelta(newPatients.length, newPatientsPrev.length, 'vs mes anterior'),
      newPatientsSpark: sparkBuckets([newPatients.length, newPatientsPrev.length]),
      topTreatment: top?.name ?? '—',
      topTreatmentSub: top ? `${top.count} reservas (${top.pct}%)` : 'Sin datos'
    },
    byStatus,
    totalAppointments: appts.length,
    topTreatments: topTreatments.slice(0, 5),
    weekdayOcc,
    dentistRows: dentistRows.slice(0, 8),
    incomeSeries: aggregateIncome('week'),
    aggregateIncome,
    billing: {
      issued: billingIssued,
      paid: billingPaid,
      pending: billingPending,
      overdue: billingOverdue,
      total: billingTotal,
      donut: billingDonut
    },
    insights,
    exportRows: {
      appts,
      payments,
      invPeriod,
      byStatus,
      topTreatments,
      dentistRows,
      kpis: { income, appointments: appts.length, attendance, pendingInvoices: pendingInvoices.length }
    }
  };
}
