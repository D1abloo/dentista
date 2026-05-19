import { useEffect, useState } from 'react';
import { STORAGE_COOKIES } from '@/lib/storage/keys';

type Pref = 'accepted' | 'rejected' | 'essential';

export function CookieBanner() {
  const [pref, setPref] = useState<Pref | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_COOKIES) as Pref | null;
    if (saved) setPref(saved);
  }, []);

  function save(value: Pref) {
    localStorage.setItem(STORAGE_COOKIES, value);
    setPref(value);
    setConfigOpen(false);
  }

  if (pref) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Preferencias de cookies">
      <p className="text-sm font-semibold text-[var(--navy)]">Usamos cookies técnicas</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Guardamos preferencias en tu navegador para la demo. Consulta la{' '}
        <a href="/cookies" className="font-bold text-[var(--blue)] underline">
          política de cookies
        </a>
        .
      </p>
      {configOpen ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Esenciales: sesión demo y localStorage. Analítica desactivada en modo demo.
        </p>
      ) : null}
      <div className="cookie-banner__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => save('accepted')}>
          Aceptar
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => save('rejected')}>
          Rechazar
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfigOpen((v) => !v)}>
          Configurar
        </button>
      </div>
    </div>
  );
}
