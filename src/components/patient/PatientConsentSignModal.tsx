import { useEffect, useRef, useState } from 'react';
import { Building2, Check, FileText, Stethoscope, User, X, type LucideIcon } from 'lucide-react';
import type { PatientConsentView } from '@/lib/patient/consentsData';
import { SignaturePad } from '@/components/shared/SignaturePad';
import { PatientIdentity } from './PatientIdentity';

type Props = {
  open: boolean;
  view: PatientConsentView | null;
  patient: { fullName: string; dni?: string; nhc?: string };
  saving?: boolean;
  success?: boolean;
  onClose: () => void;
  onSign: (payload: { dataUrl: string; method: 'draw' | 'typed' }) => void;
  onDownloadCopy?: () => void;
};

export function PatientConsentSignModal({
  open,
  view,
  patient,
  saving,
  success,
  onClose,
  onSign,
  onDownloadCopy
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<'draw' | 'typed'>('draw');
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setAccepted(false);
      setMode('draw');
      setTypedName(patient.fullName);
      setError(null);
      document.body.classList.add('pcon-sign-open');
    } else {
      document.body.classList.remove('pcon-sign-open');
    }
    return () => document.body.classList.remove('pcon-sign-open');
  }, [open, patient.fullName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onClose]);

  if (!open || !view) return null;

  function submitTyped() {
    if (!accepted) {
      setError('Debes leer y aceptar el consentimiento antes de firmar.');
      return;
    }
    const name = typedName.trim();
    if (name.length < 3) {
      setError('Añade tu firma para continuar.');
      return;
    }
    setError(null);
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('No se pudo firmar el consentimiento.');
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#0f2742';
    ctx.fillText(name, 24, 82);
    onSign({ dataUrl: canvas.toDataURL('image/png'), method: 'typed' });
  }

  function handleDrawSave(dataUrl: string) {
    if (!accepted) {
      setError('Debes leer y aceptar el consentimiento antes de firmar.');
      return;
    }
    setError(null);
    onSign({ dataUrl, method: 'draw' });
  }

  return (
    <SignBackdrop saving={saving} onClose={onClose}>
      <SignPanel ref={panelRef} success={success}>
        {success ? (
          <div className="pcon-sign__success">
            <div className="pcon-sign__check-icon" aria-hidden>
              <Check className="h-10 w-10" />
            </div>
            <h2>Consentimiento firmado correctamente</h2>
            <p>Tu consentimiento ha sido registrado y podrás descargar una copia desde esta sección.</p>
            <div className="pcon-sign__success-actions">
              <button type="button" className="pcon-btn pcon-btn--primary" onClick={onDownloadCopy}>
                Descargar copia
              </button>
              <button type="button" className="pcon-btn pcon-btn--outline" onClick={onClose}>
                Volver a consentimientos
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="pcon-sign__head">
              <div className="min-w-0">
                <p className="pcon-sign__eyebrow">Firmar consentimiento</p>
                <h2>{view.consent.title}</h2>
                <PatientIdentity patient={patient} size="sm" className="mt-2" />
              </div>
              <button type="button" className="pcon-sign__close" onClick={onClose} disabled={saving} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="pcon-sign__grid">
              <section className="pcon-sign__preview">
                <p className="pcon-sign__label">Vista previa del documento</p>
                {view.previewUrl ? (
                  view.previewUrl.endsWith('.pdf') || view.consent.fileName?.endsWith('.pdf') ? (
                    <iframe title="Vista previa PDF" src={view.previewUrl} className="pcon-sign__iframe" />
                  ) : (
                    <img src={view.previewUrl} alt="" className="pcon-sign__img" />
                  )
                ) : (
                  <div className="pcon-sign__doc-body">{view.consent.body}</div>
                )}
              </section>

              <aside className="pcon-sign__meta">
                <InfoRow icon={User} label="Paciente" value={patient.fullName} />
                <InfoRow icon={Stethoscope} label="Tratamiento" value={view.consent.treatmentName} />
                <InfoRow icon={Building2} label="Clínica" value={view.clinicName} />
                <div className="pcon-sign__legal">
                  <p className="pcon-sign__label">Confirmación legal</p>
                  <p>{view.consent.body}</p>
                </div>
              </aside>
            </div>

            <label className={`pcon-sign__check${error && !accepted ? ' pcon-sign__check--error' : ''}`}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>He leído y comprendido este consentimiento.</span>
            </label>

            <div className="pcon-sign__modes">
              <button
                type="button"
                className={`pcon-sign__mode${mode === 'draw' ? ' pcon-sign__mode--active' : ''}`}
                onClick={() => setMode('draw')}
              >
                Dibujar firma
              </button>
              <button
                type="button"
                className={`pcon-sign__mode${mode === 'typed' ? ' pcon-sign__mode--active' : ''}`}
                onClick={() => setMode('typed')}
              >
                Escribir nombre completo
              </button>
            </div>

            {mode === 'draw' ? (
              <div className={`pcon-sign__pad${error ? ' pcon-sign__pad--error' : ''}`}>
                <SignaturePad onSave={handleDrawSave} disabled={saving} />
              </div>
            ) : (
              <div className={`pcon-sign__typed${error ? ' pcon-sign__typed--error' : ''}`}>
                <label>
                  <span>Nombre completo</span>
                  <input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Escribe tu nombre completo"
                    className="pcon-sign__name-input"
                  />
                </label>
                <div className="pcon-sign__typed-preview" aria-hidden>
                  {typedName.trim() || 'Vista previa de firma'}
                </div>
              </div>
            )}

            {error ? (
              <p className="pcon-sign__error" role="alert">
                {error}
              </p>
            ) : null}

            <footer className="pcon-sign__foot">
              <button type="button" className="pcon-btn pcon-btn--outline" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              {mode === 'typed' ? (
                <button type="button" className="pcon-btn pcon-btn--primary" disabled={saving} onClick={submitTyped}>
                  {saving ? 'Firmando…' : 'Firmar consentimiento'}
                </button>
              ) : (
                <p className="pcon-sign__draw-hint">
                  <FileText className="inline h-3.5 w-3.5" aria-hidden /> Confirma tu firma en el lienzo superior.
                </p>
              )}
            </footer>
          </>
        )}
      </SignPanel>
    </SignBackdrop>
  );
}

function SignBackdrop({
  children,
  saving,
  onClose
}: {
  children: React.ReactNode;
  saving?: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="pcon-sign-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      {children}
    </div>
  );
}

function SignPanel({
  children,
  ref,
  success
}: {
  children: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement | null>;
  success?: boolean;
}) {
  return (
    <div ref={ref} className={`pcon-sign${success ? ' pcon-sign--success' : ''}`} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="pcon-sign__info">
      <Icon className="h-4 w-4 text-teal-700 shrink-0" aria-hidden />
      <div>
        <p className="pcon-sign__info-label">{label}</p>
        <p className="pcon-sign__info-value">{value}</p>
      </div>
    </div>
  );
}
