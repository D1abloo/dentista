import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Receipt,
  Search,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { isClinicSlotTaken } from '@/lib/appointments';
import { useCountUp } from '@/hooks/useCountUp';
import { resolveFocusId, usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { usePatientMutations } from '@/hooks/usePatientMutations';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { formatPatientNhc } from '@/lib/patient/homeData';
import {
  buildAppointmentKpis,
  enrichPatientAppointments,
  filterAppointmentsBySection,
  filterPatientAppointments,
  statusTone,
  type ApptChip,
  type ApptSection,
  type ApptSort,
  type PatientAppointmentView
} from '@/lib/patient/citasData';
import { Button, ConfirmModal, Modal } from '@/components/ui';

const CHIPS_BY_SECTION: Record<ApptSection, { id: ApptChip; label: string }[]> = {
  current: [
    { id: 'all', label: 'Todas' },
    { id: 'upcoming', label: 'Próximas' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'cancelled', label: 'Canceladas' }
  ],
  past: [
    { id: 'all', label: 'Todas' },
    { id: 'cancelled', label: 'Canceladas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'history', label: 'No asistió' }
  ],
  completed: [{ id: 'all', label: 'Todas' }]
};

const SECTION_META: Record<
  ApptSection,
  { title: string; subtitle: string; path: string; auditLabel: string; emptyTitle: string; emptyBody: string }
> = {
  current: {
    title: 'Mis citas',
    subtitle: 'Gestiona tus próximas visitas, cancelaciones y reprogramaciones.',
    path: '/paciente/citas',
    auditLabel: 'Listado de citas activas del paciente',
    emptyTitle: 'Aún no tienes citas activas',
    emptyBody: 'Reserva tu próxima cita online y aparecerá aquí con su estado actualizado.'
  },
  past: {
    title: 'Citas pasadas',
    subtitle: 'Citas cuya fecha ya ha transcurrido. No aparecen en Mis citas.',
    path: '/paciente/citas-pasadas',
    auditLabel: 'Listado de citas pasadas del paciente',
    emptyTitle: 'Sin citas pasadas',
    emptyBody: 'Cuando una cita supere su fecha, la verás aquí automáticamente.'
  },
  completed: {
    title: 'Citas completadas',
    subtitle: 'Todas las visitas que la clínica ha marcado como completadas.',
    path: '/paciente/citas-completadas',
    auditLabel: 'Listado de citas completadas del paciente',
    emptyTitle: 'Sin citas completadas',
    emptyBody: 'Tras cada visita finalizada, la cita completada se mostrará en esta sección.'
  }
};

function KpiStat({ label, value, delay, numeric }: { label: string; value: string | number; delay: number; numeric?: boolean }) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 650) : value;
  return (
    <article className="prt-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="prt-kpi__label">{label}</p>
      <p className="prt-kpi__value">{n}</p>
    </article>
  );
}

export function PatientAppointments({ section = 'current' }: { section?: ApptSection }) {
  const meta = SECTION_META[section];
  const chips = CHIPS_BY_SECTION[section];
  const { state } = useDemoStore();
  const patient = usePatient();
  const { cancelAppointment, rescheduleAppointment } = usePatientMutations();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<ApptChip>(section === 'current' ? 'upcoming' : 'all');
  const [sort, setSort] = useState<ApptSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const urlParams = usePatientUrlParams();
  const focusId = resolveFocusId(urlParams, ['focus', 'cita']);

  const allViews = useMemo(() => enrichPatientAppointments(state, patient.id), [state, patient.id]);
  const views = useMemo(() => filterAppointmentsBySection(allViews, section), [allViews, section]);
  const kpis = useMemo(() => buildAppointmentKpis(allViews), [allViews]);
  const filtered = useMemo(
    () => filterPatientAppointments(state, views, { q, chip, sort }),
    [state, views, q, chip, sort]
  );

  const selected = useMemo(
    () => filtered.find((v) => v.appointment.id === selectedId) ?? views.find((v) => v.appointment.id === selectedId) ?? null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: meta.path,
        resourceLabel: meta.auditLabel
      });
    }
  }, [portalAccess.active, meta.auditLabel, meta.path]);

  useEffect(() => {
    if (!focusId || section !== 'current') return;
    const match = allViews.find((v) => v.appointment.id === focusId);
    if (!match) return;
    if (match.isCompleted || match.isPast) {
      setSelectedId(match.appointment.id);
    }
  }, [focusId, section, allViews]);

  useEffect(() => {
    if (focusId) {
      const match = views.find((v) => v.appointment.id === focusId);
      if (match) {
        setSelectedId(match.appointment.id);
        return;
      }
    }
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].appointment.id);
    if (selectedId && !filtered.some((v) => v.appointment.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].appointment.id);
    }
  }, [filtered, selectedId, focusId, views]);

  useEffect(() => {
    if (selected) {
      setReschedDate(selected.appointment.date);
      setReschedTime(selected.appointment.time);
    }
  }, [selected?.appointment.id]);

  const openDetail = useCallback(
    (v: PatientAppointmentView) => {
      setSelectedId(v.appointment.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: meta.path,
          resourceLabel: v.treatment,
          resourceId: v.appointment.id
        });
      }
    },
    [portalAccess.active, meta.path]
  );

  async function downloadJustificante(v: PatientAppointmentView) {
    const a = v.appointment;
    if (!a.attendanceConfirmed) {
      setNotice({
        type: 'error',
        message: 'El justificante estará disponible cuando la clínica confirme tu asistencia.'
      });
      return;
    }
    const clinic = state.clinics.find((c) => c.id === a.clinicId);
    if (!clinic) return;
    setCertLoading(true);
    try {
      const { settingsFor } = await import('@/lib/demoStore');
      const { generateAppointmentCertificatePdf, downloadCertificateBlob } = await import(
        '@/lib/pdfAppointmentCertificate'
      );
      const settings = settingsFor(state, a.tenantId);
      const { fileRef, fileName } = await generateAppointmentCertificatePdf(a, patient, clinic, settings);
      downloadCertificateBlob(fileRef, fileName);
      setNotice({ type: 'ok', message: 'Justificante descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el documento.' });
    } finally {
      setCertLoading(false);
    }
  }

  async function onCancelConfirm() {
    if (!selected) return;
    setBusy(true);
    await cancelAppointment(selected.appointment.id, selected.clinicId);
    setBusy(false);
    setShowCancel(false);
  }

  async function onReschedConfirm() {
    if (!selected) return;
    if (isClinicSlotTaken(state, { clinicId: selected.clinicId, date: reschedDate, time: reschedTime, excludeId: selected.appointment.id })) {
      setNotice({ type: 'error', message: 'Horario no disponible. Elige otra fecha u hora.' });
      return;
    }
    setBusy(true);
    await rescheduleAppointment(selected.appointment.id, selected.clinicId, reschedDate, reschedTime);
    setBusy(false);
    setShowResched(false);
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;
  const nhc = formatPatientNhc(patient.nhc);

  return (
    <div className="prt-page">
      <header className="prt-header">
        <h2>{meta.title}</h2>
        <p>
          {meta.subtitle}
          {nhc ? ` · ${nhc}` : ''}
        </p>
        {section === 'current' ? (
          <p className="text-sm text-slate-600 mt-2 mb-0">
            Las citas con fecha pasada están en{' '}
            <span className="font-semibold text-teal-800 underline">
              Citas pasadas
            </span>
            ; las completadas, en{' '}
            <span className="font-semibold text-teal-800 underline">
              Citas completadas
            </span>
            .
          </p>
        ) : null}
        <div className="prt-security">
          <div className="prt-security__text">
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong>Citas seguras</strong>
            <span>Solo ves las citas vinculadas a tu perfil de paciente.</span>
          </div>
        </div>
      </header>

      {section === 'current' && !showEmpty ? (
        <div className="prt-kpis">
          <KpiStat label="Próximas citas" value={kpis.upcoming} delay={0} numeric />
          <KpiStat label="Confirmadas" value={kpis.confirmed} delay={70} numeric />
          <KpiStat label="Pendientes" value={kpis.pending} delay={140} numeric />
          <KpiStat label="Siguiente cita" value={kpis.nextLabel} delay={210} />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="prt-toolbar">
          <label className="prt-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por tratamiento, clínica, fecha o profesional…"
              aria-label="Buscar citas"
            />
          </label>
          <div className="prt-toolbar__row">
            <div className="prt-chips" role="tablist">
              {chips.map((c) => (
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
              <select value={sort} onChange={(e) => setSort(e.target.value as ApptSort)} aria-label="Ordenar citas">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="prt-empty">
          <div className="prt-empty__icon" aria-hidden>
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] m-0">{meta.emptyTitle}</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">{meta.emptyBody}</p>
          <p className="panel-hint text-sm text-slate-500 m-0 text-center">
            Usa el menú lateral del portal para reservar citas o consultar otras secciones.
          </p>
        </section>
      ) : showNoResults ? (
        <section className="prt-empty">
          <p className="font-bold text-slate-700 m-0">No hay citas con ese filtro</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o términos de búsqueda.</p>
        </section>
      ) : (
        <div className={`prt-layout${selected ? ' prt-layout--open' : ''}`}>
          <div>
            <h3 className="prt-list-title">{meta.title}</h3>
            {filtered.map((v, i) => (
              <article
                key={v.appointment.id}
                className={`prt-card${selectedId === v.appointment.id ? ' prt-card--active' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
              >
                <div className="prt-card__head">
                  <h4>{v.treatment}</h4>
                  <span className={`prt-status ${statusTone(v.appointment.status)}`}>{v.statusLabel}</span>
                </div>
                <p className="prt-card__meta">
                  {v.clinic} · {v.dentist}
                  <br />
                  {v.dateTimeLabel} · {v.priceLabel}
                </p>
                <div className="prt-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="prt-btn prt-btn--primary" onClick={() => openDetail(v)}>
                    Ver detalle
                  </button>
                  {v.canReschedule ? (
                    <button
                      type="button"
                      className="prt-btn prt-btn--outline"
                      onClick={() => {
                        openDetail(v);
                        setShowResched(true);
                      }}
                    >
                      Reprogramar
                    </button>
                  ) : null}
                </div>
              </article>
            ))}

            <div className="prt-privacy">
              <h4>Recordatorio</h4>
              <p>
                {section === 'completed'
                  ? 'Las citas completadas también figuran en tu historial clínico.'
                  : section === 'past'
                    ? 'Si la clínica marca la visita como completada, la cita pasará a Citas completadas.'
                    : 'Las citas con fecha pasada se mueven automáticamente a Citas pasadas.'}
              </p>
              <div className="prt-privacy-badges">
                <span>
                  <CalendarClock className="h-3 w-3" aria-hidden />
                  Próximas visitas
                </span>
                <span>
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Estado en tiempo real
                </span>
                <span>
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Portal unificado
                </span>
              </div>
            </div>
          </div>

          {selected ? (
            <>
              <div className="prt-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="prt-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle de la cita</h3>
                  <button
                    type="button"
                    className="prt-btn prt-btn--outline lg:hidden"
                    onClick={() => setSelectedId(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-[var(--corp-navy)] text-sm m-0 mb-1">{selected.treatment}</p>
                <p className="text-xs text-slate-500 m-0 mb-3">
                  {selected.clinic} · {selected.dentist}
                </p>
                <dl>
                  <div>
                    <dt>Fecha y hora</dt>
                    <dd>{selected.dateTimeLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>Importe estimado</dt>
                    <dd>{selected.priceLabel}</dd>
                  </div>
                  {selected.appointment.notes ? (
                    <div>
                      <dt>Notas</dt>
                      <dd>{selected.appointment.notes}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="prt-detail__actions flex flex-col gap-2 mt-4">
                  {selected.canCancel ? (
                    <button type="button" className="prt-btn prt-btn--outline w-full" onClick={() => setShowCancel(true)}>
                      Cancelar cita
                    </button>
                  ) : null}
                  {selected.canReschedule ? (
                    <button type="button" className="prt-btn prt-btn--primary w-full" onClick={() => setShowResched(true)}>
                      Reprogramar cita
                    </button>
                  ) : null}
                  {selected.appointment.attendanceConfirmed ? (
                    <button
                      type="button"
                      className="prt-btn prt-btn--outline w-full"
                      disabled={certLoading}
                      onClick={() => void downloadJustificante(selected)}
                    >
                      {certLoading ? 'Generando…' : 'Descargar justificante'}
                    </button>
                  ) : null}
                  <p className="panel-hint text-sm text-slate-500 m-0">
                    Informes, facturas y mensajes están en el menú lateral del portal.
                  </p>
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        open={showCancel}
        title="Cancelar cita"
        message="¿Seguro que deseas cancelar esta cita? Podrás reservar un nuevo horario cuando quieras."
        confirmLabel={busy ? 'Cancelando…' : 'Sí, cancelar'}
        onConfirm={() => void onCancelConfirm()}
        onClose={() => setShowCancel(false)}
      />

      <Modal
        open={showResched && Boolean(selected)}
        title="Reprogramar cita"
        onClose={() => setShowResched(false)}
        footer={
          <>
            <Button tone="secondary" onClick={() => setShowResched(false)}>
              Cerrar
            </Button>
            <Button disabled={busy} onClick={() => void onReschedConfirm()}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 m-0 mb-3">Indica la nueva fecha y hora disponibles.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Fecha
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={reschedDate}
              onChange={(e) => setReschedDate(e.target.value)}
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Hora
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={reschedTime}
              onChange={(e) => setReschedTime(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

export function PatientPastAppointments() {
  return <PatientAppointments section="past" />;
}

export function PatientCompletedAppointments() {
  return <PatientAppointments section="completed" />;
}
