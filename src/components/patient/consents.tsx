import { useMemo, useState } from 'react';
import type { InformedConsent } from '@/types/demo';
import { pendingConsentsForPatient, signInformedConsent } from '@/lib/demoStore';
import { saveDemoFile } from '@/lib/demoFiles';
import { fmtDate } from '@/lib/format';
import { isClientDemoMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import { useNotice } from '@/hooks/useNotice';
import { SignatureModal } from '@/components/shared/SignatureModal';
import { PatientIdentity } from './PatientIdentity';
import { Badge, Button, Card, Empty } from '@/components/ui';

export function PatientConsents({ compact = false }: { compact?: boolean }) {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const [signing, setSigning] = useState<InformedConsent | null>(null);
  const [upload, setUpload] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const mine = useMemo(
    () =>
      state.informedConsents
        .filter((c) => c.patientId === patient.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.informedConsents, patient.id]
  );

  const pending = pendingConsentsForPatient(state, patient.id);

  if (compact) {
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
        <a href="/paciente/consentimientos" className="btn btn--secondary btn--sm mt-3 inline-flex">
          Ver y firmar
        </a>
      </Card>
    );
  }

  async function submitSignature(consentId: string, dataUrl: string) {
    setSaving(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `firma-${consentId}.png`, { type: 'image/png' });
      await saveDemoFile(file);
      let docRef: string | undefined;
      if (upload) {
        docRef = await saveDemoFile(upload);
      }
      if (!isClientDemoMode()) {
        await fetch('/api/records/consent', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId: patient.preferredClinicId,
            consentId,
            signatureRef: dataUrl,
            fileRef: docRef,
            fileName: upload?.name
          })
        });
      }
      commit(signInformedConsent(state, consentId, dataUrl, docRef, upload?.name));
      setNotice({ type: 'ok', message: 'Consentimiento firmado correctamente.' });
      setSigning(null);
      setUpload(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 portal-consents">
      <PatientIdentity patient={patient} size="md" />

      {pending.length ? (
        <div className="banner-alert" role="alert">
          Tienes <strong>{pending.length}</strong> consentimiento(s) pendiente(s). Pulsa &quot;Firmar con autofirma&quot; en
          cada documento.
        </div>
      ) : null}

      {mine.map((c) => (
        <Card key={c.id} title={c.title}>
          <p className="text-sm text-[var(--muted)]">
            {c.treatmentName} · {fmtDate(c.createdAt)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{c.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              status={c.status === 'firmado' ? 'completada' : 'pendiente'}
              label={c.status === 'firmado' ? 'Firmado' : 'Pendiente de firma'}
            />
            {c.signedAt ? <span className="text-xs font-semibold text-[var(--muted)]">Firmado: {fmtDate(c.signedAt)}</span> : null}
          </div>
          {c.status === 'pendiente' ? (
            <div className="mt-4">
              <Button type="button" className="w-full sm:w-auto" onClick={() => setSigning(c)}>
                Firmar con autofirma
              </Button>
            </div>
          ) : c.signatureRef ? (
            <img src={c.signatureRef} alt="Firma del paciente" className="mt-4 max-h-24 rounded-lg border border-[var(--line)]" />
          ) : null}
        </Card>
      ))}

      {!mine.length ? (
        <Empty title="Sin consentimientos" text="La clínica publicará aquí los consentimientos que debas firmar." />
      ) : null}

      <SignatureModal
        open={Boolean(signing)}
        title={signing?.title ?? ''}
        treatmentName={signing?.treatmentName ?? ''}
        documentBody={signing?.body ?? ''}
        patient={{ fullName: patient.fullName, dni: patient.dni }}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setSigning(null);
            setUpload(null);
          }
        }}
        onSave={(dataUrl) => {
          if (signing) void submitSignature(signing.id, dataUrl);
        }}
        extra={
          <label className="block text-sm font-semibold">
            Adjuntar documento firmado (opcional)
            <input
              type="file"
              accept="application/pdf,.pdf,image/*"
              className="field-control mt-1 w-full"
              onChange={(e) => setUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        }
      />
    </div>
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
      <a href="/paciente/consentimientos" className="btn btn--teal btn--sm w-full sm:w-auto text-center">
        Firmar ahora
      </a>
    </div>
  );
}
