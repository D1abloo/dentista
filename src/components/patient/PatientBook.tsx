import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Shield,
  Stethoscope,
  User
} from 'lucide-react';
import { dentistsForClinic, getPrimaryClinic, treatmentsForClinic, clinicTenantId } from '@/lib/clinic';
import { fmtDate, todayIso } from '@/lib/format';
import { daySlotMap } from '@/lib/slots';
import {
  ANY_DENTIST_ID,
  BOOK_STEPS,
  calendarDentistId,
  clinicsForPatient,
  findNextAvailableSlot,
  formatSlotsHeader,
  mergedDaySlots,
  nextSlotLabel,
  professionalAvailabilityHint,
  resolveDentistId,
  treatmentBlurb,
  type BookStep
} from '@/lib/patient/bookingFlow';
import { BookingDayCalendar } from '@/components/shared/BookingDayCalendar';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatientMutations } from '@/hooks/usePatientMutations';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { Field, Textarea } from '@/components/ui';

const FOOTER_TIPS = [
  'Llega 10 minutos antes.',
  'Trae tu documentación si es tu primera visita.',
  { text: 'Revisa tus alergias y datos personales en ', link: 'Perfil', href: '/paciente/perfil' }
] as const;

export function PatientBook() {
  const { state } = useDemoStore();
  const { bookAppointment } = usePatientMutations();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();

  const availableClinics = useMemo(() => clinicsForPatient(state, patient), [state, patient]);

  const defaultClinic = patient.preferredClinicId
    ? (state.clinics.find((c) => c.id === patient.preferredClinicId) ??
        getPrimaryClinic(state, clinicTenantId(state, patient.preferredClinicId)))
    : availableClinics[0] ?? getPrimaryClinic(state);

  const [step, setStep] = useState<BookStep>(1);
  const [success, setSuccess] = useState(false);
  const [clinicId, setClinicId] = useState(defaultClinic.id);
  const [treatmentId, setTreatmentId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [cabinetId, setCabinetId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [stepAnim, setStepAnim] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const clinica = p.get('clinica');
    const tratamiento = p.get('tratamiento');
    const seguimiento = p.get('seguimiento');
    if (clinica && state.clinics.some((c) => c.id === clinica)) {
      setClinicId(clinica);
      if (!tratamiento && !seguimiento) setStep(2);
    }
    if (tratamiento && state.treatments.some((t) => t.id === tratamiento)) {
      setTreatmentId(tratamiento);
      setStep(3);
    }
    if (seguimiento) {
      setNotes(`Seguimiento de visita ${seguimiento}`);
      if (clinica && tratamiento) setStep(4);
      else if (clinica) setStep(2);
    }
  }, [state.clinics, state.treatments]);

  const clinic = state.clinics.find((c) => c.id === clinicId);
  const treatment = state.treatments.find((t) => t.id === treatmentId);
  const dentists = dentistsForClinic(state, clinicId);
  const resolvedDentist = useMemo(() => {
    if (!dentistId || !date || !time || !treatmentId || !clinic) return null;
    const cab = cabinetId || clinic.cabinets.find((g) => g.active)?.id || clinic.cabinets[0]?.id || 'g-1';
    return resolveDentistId(state, {
      clinicId,
      dentistId,
      cabinetId: cab,
      date,
      time,
      treatmentId
    });
  }, [state, clinicId, dentistId, cabinetId, date, time, treatmentId, clinic]);

  const dentist = state.dentists.find((d) => d.id === (resolvedDentist ?? dentistId));
  const dentistLabel =
    dentistId === ANY_DENTIST_ID
      ? dentist
        ? dentist.fullName
        : 'Cualquier profesional disponible'
      : dentist?.fullName ?? 'Pendiente de seleccionar';

  const activeCabinet =
    cabinetId || clinic?.cabinets.find((g) => g.active)?.id || clinic?.cabinets[0]?.id || 'g-1';

  const slotCells = useMemo(() => {
    if (!date || !treatmentId || !dentistId || !clinicId) return [];
    const opts = { clinicId, cabinetId: activeCabinet, date, treatmentId };
    if (dentistId === ANY_DENTIST_ID) return mergedDaySlots(state, opts, dentists);
    const did = calendarDentistId(dentistId, dentists);
    if (!did) return [];
    return daySlotMap(state, { ...opts, dentistId: did });
  }, [state, clinicId, dentistId, activeCabinet, date, treatmentId, dentists]);

  const slots = useMemo(() => slotCells.filter((s) => s.selectable).map((s) => s.time), [slotCells]);

  const nextHint = useMemo(() => {
    if (!clinicId || !treatmentId || !dentistId) return null;
    return nextSlotLabel(state, {
      clinicId,
      treatmentId,
      dentistId,
      cabinetId: activeCabinet
    });
  }, [state, clinicId, treatmentId, dentistId, activeCabinet]);

  useEffect(() => {
    if (availableClinics.length === 1 && !clinicId) {
      setClinicId(availableClinics[0].id);
    }
  }, [availableClinics, clinicId]);

  useEffect(() => {
    if (clinic && !cabinetId) {
      setCabinetId(clinic.cabinets.find((g) => g.active)?.id ?? clinic.cabinets[0]?.id ?? 'g-1');
    }
  }, [clinic, cabinetId]);

  function goStep(next: BookStep) {
    setStepAnim((k) => k + 1);
    setStep(next);
  }

  function validateStep(s: BookStep): boolean {
    const e: Record<string, string> = {};
    if (s === 1 && !clinicId) e.clinicId = 'Selecciona una clínica para continuar.';
    if (s === 2 && !treatmentId) e.treatmentId = 'Selecciona un tratamiento.';
    if (s === 3 && !dentistId) e.dentistId = 'Selecciona un profesional.';
    if (s === 4) {
      if (!date) e.date = 'Selecciona una fecha.';
      if (!time) e.time = 'Selecciona una hora.';
      if (date && time && treatmentId && dentistId) {
        const resolved = resolveDentistId(state, {
          clinicId,
          dentistId,
          cabinetId: activeCabinet,
          date,
          time,
          treatmentId
        });
        if (!resolved) e.time = 'La cita ya no está disponible. Elige otro horario.';
      }
    }
    if (s === 5 && !reviewed) e.reviewed = 'Debes revisar los datos antes de confirmar.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function continueStep() {
    if (!validateStep(step)) return;
    if (step < 6) goStep((step + 1) as BookStep);
  }

  function backStep() {
    setErrors({});
    if (step === 6) goStep(5);
    else if (step > 1) goStep((step - 1) as BookStep);
  }

  function pickClinic(id: string) {
    setClinicId(id);
    const c = state.clinics.find((x) => x.id === id);
    setCabinetId(c?.cabinets.find((g) => g.active)?.id ?? c?.cabinets[0]?.id ?? 'g-1');
    setTreatmentId('');
    setDentistId('');
    setTime('');
    setErrors({});
  }

  function pickTreatment(id: string) {
    setTreatmentId(id);
    setDentistId('');
    setTime('');
    setErrors({});
  }

  function pickDentist(id: string) {
    setDentistId(id);
    setTime('');
    setErrors({});
  }

  function searchNextSlot() {
    if (!clinicId || !treatmentId || !dentistId) {
      setNotice({ type: 'error', message: 'Completa clínica, tratamiento y profesional primero.' });
      return;
    }
    const pick = findNextAvailableSlot(state, {
      clinicId,
      treatmentId,
      dentistId,
      cabinetId: activeCabinet
    });
    if (!pick) {
      setNotice({ type: 'error', message: 'No hay horarios disponibles. Prueba con otro día, profesional o tratamiento.' });
      return;
    }
    setDate(pick.date);
    setTime(pick.time);
    if (dentistId === ANY_DENTIST_ID) setDentistId(pick.dentistId);
    setNotice({ type: 'ok', message: `Hueco encontrado: ${fmtDate(pick.date)} · ${pick.time}` });
  }

  function resetBooking() {
    setSuccess(false);
    setStep(1);
    setTreatmentId('');
    setDentistId('');
    setDate(todayIso());
    setTime('');
    setNotes('');
    setReviewed(false);
    setErrors({});
    setClinicId(defaultClinic.id);
  }

  async function confirm() {
    if (!validateStep(4) || !validateStep(5)) {
      if (!reviewed) setErrors({ reviewed: 'Debes revisar los datos antes de confirmar.' });
      return;
    }
    const finalDentist = resolveDentistId(state, {
      clinicId,
      dentistId,
      cabinetId: activeCabinet,
      date,
      time,
      treatmentId
    });
    if (!finalDentist) {
      setErrors({ time: 'La cita ya no está disponible. Elige otro horario.' });
      setNotice({ type: 'error', message: 'La cita ya no está disponible. Elige otro horario.' });
      goStep(4);
      return;
    }

    setBusy(true);
    try {
      const result = await bookAppointment({
        clinicId,
        dentistId: finalDentist,
        cabinetId: activeCabinet,
        treatmentId,
        date,
        time,
        notes,
        tenantId: clinicTenantId(state, clinicId)
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.message ?? 'No se pudo reservar la cita.' });
        setErrors({ time: 'La cita ya no está disponible. Elige otro horario.' });
        goStep(4);
        return;
      }
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/reservar',
          resourceLabel: `Cita reservada ${date} ${time}`
        });
      }
      setSuccess(true);
    } catch {
      setNotice({ type: 'error', message: 'No se pudo reservar la cita.' });
    } finally {
      setBusy(false);
    }
  }

  const summaryRows: { label: string; value: string }[] = [
    { label: 'Clínica', value: clinic?.name ?? 'Pendiente de seleccionar' },
    { label: 'Tratamiento', value: treatment?.name ?? 'Pendiente de seleccionar' },
    { label: 'Profesional', value: dentistLabel },
    { label: 'Fecha', value: date ? fmtDate(date) : 'Pendiente de seleccionar' },
    { label: 'Hora', value: time || 'Pendiente de seleccionar' },
    { label: 'Duración', value: treatment ? `${treatment.durationMinutes} min` : '—' }
  ];

  if (success) {
    return (
      <div className="pb-page pb-card">
        <div className="pb-success">
          <div className="pb-success__icon" aria-hidden>
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--corp-navy)] m-0">Cita solicitada correctamente</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Tu cita ha sido registrada. La clínica podrá confirmarla y recibirás una notificación en tu portal.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <a href="/paciente/citas" className="pb-btn pb-btn--primary no-underline">
              Ver mis citas
            </a>
            <button type="button" className="pb-btn pb-btn--outline" onClick={resetBooking}>
              Reservar otra cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-page pb-card">
      <header className="pb-header">
        <h2>
          <Calendar className="h-5 w-5 text-teal-600" aria-hidden />
          Reservar cita
        </h2>
        <p>Elige clínica, tratamiento, profesional y horario disponible para confirmar tu próxima visita.</p>
        <div className="pb-helper" role="note">
          <Shield className="h-5 w-5 text-teal-700 shrink-0" aria-hidden />
          <div>
            <strong>Reserva rápida y segura</strong>
            <span>Tu cita quedará registrada en el portal y recibirás confirmación cuando la clínica la valide.</span>
          </div>
        </div>
      </header>

      <div className="pb-step-meta">
        <span>
          Paso {step} de {BOOK_STEPS.length}
        </span>
        <span>{BOOK_STEPS[step - 1]}</span>
      </div>

      <div className="pb-stepper" role="list" aria-label="Progreso de reserva">
        {BOOK_STEPS.map((label, i) => {
          const n = (i + 1) as BookStep;
          const done = step > n;
          const active = step === n;
          return (
            <div
              key={label}
              role="listitem"
              className={`pb-stepper__item${done ? ' pb-stepper__item--done' : ''}${active ? ' pb-stepper__item--active' : ''}`}
            >
              <div className="pb-stepper__dot" aria-current={active ? 'step' : undefined}>
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span className="pb-stepper__label">{label}</span>
            </div>
          );
        })}
      </div>

      {step > 1 ? (
        <div className="pb-chips">
          {clinic ? (
            <span className="pb-chip">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {clinic.name}
            </span>
          ) : null}
          {treatment ? (
            <span className="pb-chip">
              <Stethoscope className="h-3.5 w-3.5" aria-hidden />
              {treatment.name}
            </span>
          ) : null}
          {dentistId ? (
            <span className="pb-chip">
              <User className="h-3.5 w-3.5" aria-hidden />
              {dentistLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="pb-layout">
        <div className="pb-step-panel" key={stepAnim}>
          {step === 1 ? (
            <>
              <h3 className="pb-step-title">Elige una clínica</h3>
              {errors.clinicId ? <p className="pb-field-err-box">{errors.clinicId}</p> : null}
              <div className="pb-grid-2">
                {availableClinics.map((c) => {
                  const selected = clinicId === c.id;
                  const onlyOne = availableClinics.length === 1;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`pb-select-card${selected ? ' pb-select-card--active' : ''}`}
                      onClick={() => pickClinic(c.id)}
                    >
                      <h4>{c.name}</h4>
                      <p>
                        {c.city} · {c.address}
                      </p>
                      <p>Horario: {c.openingHours || '08:30 – 20:00'}</p>
                      <span className="pb-badge">{onlyOne && selected ? 'Clínica seleccionada' : 'Disponible'}</span>
                    </button>
                  );
                })}
              </div>
              {availableClinics.length === 1 ? (
                <p className="text-xs font-bold text-teal-800 mt-2">Clínica única asignada a tu perfil.</p>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3 className="pb-step-title">Elige el motivo de tu cita</h3>
              {errors.treatmentId ? <p className="pb-field-err-box">{errors.treatmentId}</p> : null}
              <div className="pb-grid-2">
                {treatmentsForClinic(state, clinicId).filter((t) => t.active).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`pb-select-card${treatmentId === t.id ? ' pb-select-card--active' : ''}`}
                    onClick={() => pickTreatment(t.id)}
                  >
                    <h4>{t.name}</h4>
                    <p>{t.durationMinutes} min</p>
                    <p>{treatmentBlurb(t)}</p>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3 className="pb-step-title">Elige profesional</h3>
              {errors.dentistId ? <p className="pb-field-err-box">{errors.dentistId}</p> : null}
              <div className="space-y-3">
                <button
                  type="button"
                  className={`pb-select-card${dentistId === ANY_DENTIST_ID ? ' pb-select-card--active' : ''}`}
                  onClick={() => pickDentist(ANY_DENTIST_ID)}
                >
                  <h4>Cualquier profesional disponible</h4>
                  <p>El sistema buscará el primer hueco libre.</p>
                  {nextHint ? <p className="text-teal-700 font-bold text-xs mt-1">Próximo hueco: {nextHint}</p> : null}
                </button>
                {dentists.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`pb-select-card${dentistId === d.id ? ' pb-select-card--active' : ''}`}
                    onClick={() => pickDentist(d.id)}
                  >
                    <h4>{d.fullName}</h4>
                    <p>{d.specialty}</p>
                    <p>{professionalAvailabilityHint(state, clinicId, d, treatmentId, activeCabinet)}</p>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h3 className="pb-step-title">Elige fecha y hora</h3>
              {(errors.date || errors.time) ? (
                <p className="pb-field-err-box mb-2">{errors.date ?? errors.time}</p>
              ) : null}
              {!treatmentId || !dentistId ? (
                <p className="pb-field-err">Completa tratamiento y profesional antes de elegir fecha.</p>
              ) : (
                <div className="pb-date-layout">
                  <div>
                    <BookingDayCalendar
                      state={state}
                      clinicId={clinicId}
                      dentistId={calendarDentistId(dentistId, dentists)}
                      cabinetId={activeCabinet}
                      treatmentId={treatmentId}
                      value={date}
                      onChange={(d) => {
                        setDate(d);
                        setTime('');
                      }}
                    />
                  </div>
                  <div>
                    {date ? (
                      <>
                        <p className="text-sm font-bold text-slate-700 m-0">{formatSlotsHeader(date)}</p>
                        {slots.length ? (
                          <div className="slot-cal mt-2">
                            <div className="slot-cal__grid" role="listbox" aria-label="Horas disponibles">
                              {slotCells
                                .filter((s) => s.selectable)
                                .map((s) => (
                                  <button
                                    key={s.time}
                                    type="button"
                                    role="option"
                                    aria-selected={time === s.time}
                                    className={`slot-cal__cell slot-cal__cell--free ${time === s.time ? 'slot-cal__cell--picked' : ''}`}
                                    onClick={() => setTime(s.time)}
                                  >
                                    {s.time}
                                  </button>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pb-empty-slots mt-2">
                            <h4 className="m-0 text-sm font-extrabold">No hay horarios disponibles</h4>
                            <p className="text-xs text-slate-500 mt-1">Prueba con otro día, profesional o tratamiento.</p>
                            <button type="button" className="pb-btn pb-btn--outline mt-3" onClick={searchNextSlot}>
                              Buscar siguiente hueco
                            </button>
                          </div>
                        )}
                        {nextHint ? (
                          <p className="pb-slot-hint">
                            <Clock className="h-4 w-4" aria-hidden />
                            Próximo hueco disponible: {nextHint}
                          </p>
                        ) : null}
                        <button type="button" className="pb-link-btn mt-1" onClick={searchNextSlot}>
                          <ChevronRight className="inline h-3 w-3" aria-hidden />
                          Buscar siguiente hueco
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Selecciona un día disponible en el calendario.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {step === 5 ? (
            <>
              <h3 className="pb-step-title">Revisa tu cita</h3>
              <ul className="pb-summary-list mb-3">
                {summaryRows.map((r) => (
                  <li key={r.label}>
                    <span>{r.label}</span>
                    <span>{r.value}</span>
                  </li>
                ))}
                <li>
                  <span>Estado inicial</span>
                  <span className="pb-badge pb-badge--pending">Pendiente de confirmación</span>
                </li>
              </ul>
              <label className="flex items-start gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-1" />
                He revisado los datos de mi cita.
              </label>
              {errors.reviewed ? <p className="pb-field-err">{errors.reviewed}</p> : null}
            </>
          ) : null}

          {step === 6 ? (
            <>
              <h3 className="pb-step-title">Confirmar cita</h3>
              <p className="text-sm text-slate-600">
                Al confirmar, tu cita quedará registrada en el portal del paciente.
              </p>
              <Field label="Notas para la clínica (opcional)" className="mt-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </Field>
              <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" className="pb-btn pb-btn--primary" disabled={busy} onClick={() => void confirm()}>
                  {busy ? 'Confirmando…' : 'Confirmar cita'}
                </button>
                <button type="button" className="pb-btn pb-btn--outline" disabled={busy} onClick={backStep}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Volver al resumen
                </button>
              </div>
            </>
          ) : null}
        </div>

        <aside className="pb-summary-sticky">
          <h3>
            <ClipboardList className="h-4 w-4 text-teal-600" aria-hidden />
            Resumen de tu cita
          </h3>
          <ul className="pb-summary-list">
            {summaryRows.map((r) => (
              <li key={r.label}>
                <span>{r.label}</span>
                <span>{r.value}</span>
              </li>
            ))}
          </ul>
          {step >= 5 ? (
            <p className="text-xs mb-2">
              <span className="pb-badge pb-badge--pending">Pendiente de confirmación</span>
            </p>
          ) : null}
          <div className="pb-summary-actions">
            {step < 6 ? (
              <>
                <button type="button" className="pb-btn pb-btn--primary" onClick={continueStep}>
                  <Calendar className="h-4 w-4" aria-hidden />
                  Continuar
                </button>
                {step > 1 ? (
                  <button type="button" className="pb-btn pb-btn--outline" onClick={backStep}>
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Volver
                  </button>
                ) : null}
              </>
            ) : (
              <button type="button" className="pb-btn pb-btn--outline" onClick={backStep}>
                Volver
              </button>
            )}
          </div>
        </aside>
      </div>

      <ul className="pb-footer-tips">
        {FOOTER_TIPS.map((tip) =>
          typeof tip === 'string' ? (
            <li key={tip}>
              <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden />
              {tip}
            </li>
          ) : (
            <li key={tip.link}>
              <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden />
              {tip.text}
              <a href={tip.href}>{tip.link}</a>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
