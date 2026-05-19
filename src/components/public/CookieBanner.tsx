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
    <div className="lp-cookie" role="dialog" aria-label="Preferencias de cookies">
      <div className="shell lp-cookie__inner">
        <p className="lp-cookie__text">
          <span aria-hidden>🍪</span> Usamos cookies técnicas para guardar preferencias y la sesión demo.{' '}
          <a href="/cookies">Más información</a>
        </p>
        {configOpen ? (
          <p className="lp-cookie__detail">Solo cookies esenciales (localStorage). Sin analítica en modo demo.</p>
        ) : null}
        <div className="lp-cookie__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfigOpen((v) => !v)}>
            Personalizar
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => save('accepted')}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
