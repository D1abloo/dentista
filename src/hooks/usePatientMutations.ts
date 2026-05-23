import { useCallback } from 'react';
import type { DemoState, Message, Patient, Payment } from '@/types/demo';
import { createAppointmentLive, patchAppointmentLive } from '@/lib/clinicApi';
import { notifyNewAppointmentRequest } from '@/lib/clinicNotifications';
import {
  addMessage,
  createPayment,
  rescheduleAppointment,
  savePatient,
  signInformedConsent,
  tryCreateAppointment,
  updateAppointmentStatus
} from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { patientName } from '@/lib/selectors';

export function usePatientMutations() {
  const { state, commit, refresh } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();

  const persist = useCallback(
    (next: DemoState) => {
      commit(next);
    },
    [commit]
  );

  const bookAppointment = useCallback(
    async (input: {
      clinicId: string;
      dentistId: string;
      cabinetId: string;
      treatmentId: string;
      date: string;
      time: string;
      notes?: string;
      tenantId?: string;
    }) => {
      const local = tryCreateAppointment(state, {
        patientId: patient.id,
        tenantId: input.tenantId,
        dentistId: input.dentistId,
        clinicId: input.clinicId,
        cabinetId: input.cabinetId,
        treatmentId: input.treatmentId,
        date: input.date,
        time: input.time,
        notes: input.notes ?? '',
        status: 'pendiente',
        fromPatient: true
      });
      if (!local.ok) {
        return { ok: false as const, message: local.message ?? 'No se pudo reservar la cita.' };
      }

      let next = local.state;
      const treatment = state.treatments.find((t) => t.id === input.treatmentId);
      const clinic = state.clinics.find((c) => c.id === input.clinicId);
      const created = next.appointments[next.appointments.length - 1];

      const live = await createAppointmentLive({
        clinicId: input.clinicId,
        patientId: patient.id,
        patientName: patient.fullName,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        dentistId: input.dentistId,
        treatmentId: input.treatmentId,
        roomName: clinic?.cabinets.find((cab) => cab.id === input.cabinetId)?.name ?? 'Gabinete 1',
        date: input.date,
        time: input.time,
        notes: input.notes
      });

      if (!live.ok) {
        if (created) next = notifyNewAppointmentRequest(next, created, { fromPatient: true });
        persist(next);
        setNotice({ type: 'ok', message: 'Cita reservada correctamente.' });
        return { ok: true as const, appointmentId: created?.id };
      }

      await refresh();
      const refreshed = (await fetch('/api/clinic/bootstrap', { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => null)) as { data?: { state?: DemoState } } | null;
      if (refreshed?.data?.state) {
        next = refreshed.data.state;
        const synced =
          (created?.id ? next.appointments.find((a) => a.id === created.id) : undefined) ??
          next.appointments
            .filter((a) => a.patientId === patient.id && a.date === input.date && a.time === input.time)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (synced && synced.status === 'pendiente') {
          next = notifyNewAppointmentRequest(next, synced, { fromPatient: true });
        }
        persist(next);
      } else if (created) {
        persist(notifyNewAppointmentRequest(next, created, { fromPatient: true }));
      } else {
        persist(next);
      }

      setNotice({ type: 'ok', message: 'Cita reservada correctamente.' });
      return { ok: true as const, appointmentId: created?.id, treatmentName: treatment?.name };
    },
    [state, patient, persist, refresh, setNotice]
  );

  const cancelAppointment = useCallback(
    async (appointmentId: string, clinicId: string) => {
      const live = await patchAppointmentLive({
        clinicId,
        appointmentId,
        status: 'cancelada'
      });
      let next = updateAppointmentStatus(state, appointmentId, 'cancelada');
      if (live.ok) {
        await refresh().catch(() => undefined);
      }
      persist(next);
      setNotice({
        type: live.ok ? 'ok' : 'error',
        message: live.ok ? 'Cita cancelada correctamente.' : live.message ?? 'No se pudo cancelar la cita.'
      });
      return live.ok;
    },
    [state, persist, refresh, setNotice]
  );

  const rescheduleAppointmentAction = useCallback(
    async (appointmentId: string, clinicId: string, date: string, time: string) => {
      const live = await patchAppointmentLive({
        clinicId,
        appointmentId,
        status: 'reprogramada',
        date,
        time
      });
      let next = rescheduleAppointment(state, appointmentId, date, time);
      if (live.ok) {
        await refresh().catch(() => undefined);
      }
      persist(next);
      setNotice({
        type: live.ok ? 'ok' : 'error',
        message: live.ok ? 'Cita reprogramada correctamente.' : live.message ?? 'No se pudo reprogramar la cita.'
      });
      return live.ok;
    },
    [state, persist, refresh, setNotice]
  );

  const savePatientProfile = useCallback(
    (updated: Patient) => {
      const next = savePatient(state, updated);
      persist(next);
      setNotice({ type: 'ok', message: 'Cambios guardados correctamente.' });
    },
    [state, persist, setNotice]
  );

  const postMessage = useCallback(
    (message: Omit<Message, 'id' | 'tenantId'> & { tenantId?: string }) => {
      const next = addMessage(state, { ...message, patientId: patient.id });
      persist(next);
      setNotice({ type: 'ok', message: 'Mensaje enviado correctamente.' });
    },
    [state, patient.id, persist, setNotice]
  );

  const recordPayment = useCallback(
    (payment: Omit<Payment, 'id' | 'tenantId'> & { tenantId?: string }) => {
      const next = createPayment(state, { ...payment, patientId: patient.id });
      persist(next);
      setNotice({ type: 'ok', message: 'Pago registrado correctamente.' });
      return next;
    },
    [state, patient.id, persist, setNotice]
  );

  const signConsent = useCallback(
    (
      consentId: string,
      signatureDataUrl: string,
      fileRef?: string,
      fileName?: string,
      opts?: { signatureMethod?: import('@/types/demo').ConsentSignatureMethod; signedCopyRef?: string }
    ) => {
      const next = signInformedConsent(state, consentId, signatureDataUrl, fileRef, fileName, opts);
      persist(next);
      setNotice({ type: 'ok', message: 'Consentimiento firmado correctamente.' });
      return next;
    },
    [state, persist, setNotice]
  );

  return {
    state,
    patient,
    persist,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment: rescheduleAppointmentAction,
    savePatientProfile,
    postMessage,
    recordPayment,
    signConsent,
    patientDisplayName: patientName(state, patient.id)
  };
}
