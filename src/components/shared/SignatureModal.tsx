import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PenLine, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { PatientIdentity } from '@/components/patient/PatientIdentity';
import { SignaturePad } from './SignaturePad';

type Props = {
  open: boolean;
  title: string;
  treatmentName: string;
  documentBody: string;
  patient: { fullName: string; dni?: string };
  saving?: boolean;
  extra?: ReactNode;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

/**
 * Modal de autofirma: primero solicita permiso de entrada táctil/lápiz,
 * luego muestra el documento y el lienzo de firma.
 */
export function SignatureModal({
  open,
  title,
  treatmentName,
  documentBody,
  patient,
  saving,
  extra,
  onClose,
  onSave
}: Props) {
  const [step, setStep] = useState<'permission' | 'sign'>('permission');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep('permission');
      setPermissionError(null);
      document.body.classList.add('sig-modal-open');
    } else {
      document.body.classList.remove('sig-modal-open');
    }
    return () => document.body.classList.remove('sig-modal-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function requestSignatureAccess() {
    setPermissionError(null);
    try {
      if (typeof window !== 'undefined' && !window.PointerEvent) {
        setPermissionError('Tu navegador no admite firma táctil. Prueba con Chrome, Safari o Firefox actualizado.');
        return;
      }
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* noop */
        }
      }
      setStep('sign');
      requestAnimationFrame(() => panelRef.current?.querySelector('canvas')?.focus());
    } catch {
      setPermissionError('No se pudo activar la firma. Comprueba los permisos del navegador e inténtalo de nuevo.');
    }
  }

  if (!open) return null;

  return (
    <div
      className="sig-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="sig-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sig-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sig-modal__head">
          <div className="sig-modal__head-main">
            <p className="sig-modal__eyebrow">Consentimiento informado · {treatmentName}</p>
            <h2 id="sig-modal-title" className="sig-modal__title">
              {title}
            </h2>
            <PatientIdentity patient={patient} size="sm" className="mt-2" />
          </div>
          <button type="button" className="sig-modal__close" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>

        {step === 'permission' ? (
          <div className="sig-modal__permission">
            <div className="sig-modal__permission-icon" aria-hidden>
              <PenLine className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--navy)]">Activar autofirma en este dispositivo</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Para firmar el documento necesitamos usar la pantalla táctil o el lápiz del dispositivo. Al continuar,
              autorizas la captura de tu firma manuscrita en este consentimiento.
            </p>
            {permissionError ? (
              <p className="mt-3 text-sm font-semibold text-rose-700" role="alert">
                {permissionError}
              </p>
            ) : null}
            <div className="sig-modal__permission-actions">
              <Button type="button" onClick={() => void requestSignatureAccess()}>
                <ShieldCheck className="mr-1 inline h-4 w-4" />
                Permitir y abrir firma
              </Button>
              <Button type="button" tone="secondary" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="sig-modal__doc">
              <p className="sig-modal__doc-label">Documento a firmar</p>
              <div className="sig-modal__doc-body">{documentBody}</div>
            </div>
            <div className="sig-modal__pad">
              <p className="sig-modal__doc-label">Tu firma</p>
              <SignaturePad onSave={onSave} disabled={saving} />
            </div>
            {extra ? <div className="sig-modal__extra">{extra}</div> : null}
            <footer className="sig-modal__foot">
              <Button type="button" tone="secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
