import { useMemo } from 'react';
import { pendingConsentsForPatient } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import { PatientIdentity } from './PatientIdentity';
import { Card } from '@/components/ui';

/** Resumen compacto para el perfil del paciente. */
export function PatientConsentsCompact() {
  const { state } = useDemoStore();
  const patient = usePatient();

  const mine = useMemo(
    () =>
      state.informedConsents
        .filter((c) => c.patientId === patient.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.informedConsents, patient.id]
  );

  const pending = pendingConsentsForPatient(state, patient.id);
  const signed = mine.filter((c) => c.status === 'firmado').length;

  return (
    <Card title="Consentimientos informados">
      <PatientIdentity patient={patient} size="sm" />
      <p className="mt-2 text-sm text-[var(--muted)]">
        {signed} firmado(s) · {pending.length} pendiente(s)
      </p>
      {pending.length ? (
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Debes firmar los consentimientos pendientes antes de tu visita.
        </p>
      ) : null}
      <span className="btn btn--secondary btn--sm mt-3 inline-flex">
        Ver y firmar
      </span>
    </Card>
  );
}

export function PatientConsentAlert() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const pending = pendingConsentsForPatient(state, patient.id);
  if (!pending.length) return null;
  return (
    <div className="banner-alert mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <span>
        Tienes <strong>{pending.length}</strong> consentimiento(s) por firmar antes de tu próxima visita.
      </span>
      <span className="btn btn--teal btn--sm w-full sm:w-auto text-center">
        Firmar ahora
      </span>
    </div>
  );
}
