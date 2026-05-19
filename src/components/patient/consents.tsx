import { useMemo, useState } from 'react';
import { pendingConsentsForPatient, signInformedConsent } from '@/lib/demoStore';
import { saveDemoFile } from '@/lib/demoFiles';
import { fmtDate } from '@/lib/format';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import { useNotice } from '@/hooks/useNotice';
import { SignaturePad } from '@/components/shared/SignaturePad';
import { Badge, Button, Card, Empty } from '@/components/ui';
import { IdBadge } from '@/components/ui/IdBadge';

export function PatientConsents({ compact = false }: { compact?: boolean }) {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const [signingId, setSigningId] = useState<string | null>(null);
  const [upload, setUpload] = useState<File | null>(null);

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
        <p className="text-sm text-[var(--muted)]">
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
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `firma-${consentId}.png`, { type: 'image/png' });
    const fileRef = await saveDemoFile(file);
    let docRef: string | undefined;
    if (upload) {
      docRef = await saveDemoFile(upload);
    }
    commit(signInformedConsent(state, consentId, dataUrl, docRef, upload?.name));
    setNotice({ type: 'ok', message: 'Consentimiento firmado correctamente.' });
    setSigningId(null);
    setUpload(null);
  }

  return (
    <div className="space-y-4">
      {pending.length ? (
        <div className="banner-alert" role="alert">
          Tienes <strong>{pending.length}</strong> consentimiento(s) pendiente(s). Debes firmarlos para continuar con
          ciertos tratamientos.
        </div>
      ) : null}

      {mine.map((c) => (
        <Card key={c.id} title={c.title}>
          <p className="text-sm text-[var(--muted)]">
            <IdBadge id={c.id} kind="documento" /> · {c.treatmentName} · {fmtDate(c.createdAt)}
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
            <div className="mt-4 space-y-3">
              {signingId === c.id ? (
                <>
                  <SignaturePad onSave={(dataUrl) => void submitSignature(c.id, dataUrl)} />
                  <label className="block text-sm font-semibold">
                    Adjuntar documento firmado (opcional)
                    <input
                      type="file"
                      accept="application/pdf,.pdf,image/*"
                      className="field-control mt-1"
                      onChange={(e) => setUpload(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <Button tone="secondary" onClick={() => setSigningId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setSigningId(c.id)}>Firmar con autofirma</Button>
              )}
            </div>
          ) : c.signatureRef ? (
            <img src={c.signatureRef} alt="Firma del paciente" className="mt-4 max-h-24 rounded-lg border border-[var(--line)]" />
          ) : null}
        </Card>
      ))}

      {!mine.length ? (
        <Empty title="Sin consentimientos" text="La clínica publicará aquí los consentimientos que debas firmar." />
      ) : null}
    </div>
  );
}

export function PatientConsentAlert() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const pending = pendingConsentsForPatient(state, patient.id);
  if (!pending.length) return null;
  return (
    <div className="banner-alert mb-4 flex flex-wrap items-center justify-between gap-2" role="alert">
      <span>
        Tienes <strong>{pending.length}</strong> consentimiento(s) por firmar antes de tu próxima visita.
      </span>
      <a href="/paciente/consentimientos" className="btn btn--teal btn--sm">
        Firmar ahora
      </a>
    </div>
  );
}
