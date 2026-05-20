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
    <div className="lp-cookie" role="dialog" aria-label="Preferencias de cookies" aria-modal="false">
      <div className="shell lp-cookie__inner">
        <div className="lp-cookie__main">
          <p className="lp-cookie__title">Tu privacidad en Dentista+</p>
          <p className="lp-cookie__text">
            Usamos cookies y almacenamiento local estrictamente necesarios para la sesión, la seguridad y recordar esta
            elección. Las cookies analíticas o de marketing no se activan sin tu consentimiento. Consulta la{' '}
            <a href="/cookies">política de cookies</a> y la <a href="/privacidad">política de privacidad</a>.
          </p>
          {configOpen ? (
            <div className="lp-cookie__detail">
              <p>
                <strong>Aceptar:</strong> cookies esenciales y, cuando existan, cookies de mejora/analítica autorizadas.
              </p>
              <p>
                <strong>Solo esenciales:</strong> únicamente sesión (df_session), preferencia de cookies y funciones
                imprescindibles del sitio.
              </p>
              <p>
                <strong>Rechazar opcionales:</strong> equivalente a solo esenciales; no usamos cookies publicitarias por
                defecto.
              </p>
            </div>
          ) : null}
        </div>
        <div className="lp-cookie__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfigOpen((v) => !v)}>
            {configOpen ? 'Ocultar' : 'Personalizar'}
          </button>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => save('rejected')}>
            Rechazar opcionales
          </button>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => save('essential')}>
            Solo esenciales
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => save('accepted')}>
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
