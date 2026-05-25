import { useState } from 'react';
import { Facebook, Instagram, Linkedin, MessageCircle, Youtube } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { Input } from '@/components/ui';
import { email } from '@/lib/validation';
import {
  publicFooterBottomLinks,
  publicFooterColumns,
  publicSocialLinks
} from '@/lib/landing/landingClosingContent';

const SOCIAL = [
  { key: 'facebook' as const, Icon: Facebook, label: 'Facebook' },
  { key: 'instagram' as const, Icon: Instagram, label: 'Instagram' },
  { key: 'linkedin' as const, Icon: Linkedin, label: 'LinkedIn' },
  { key: 'youtube' as const, Icon: Youtube, label: 'YouTube' }
];

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div className="ps-footer__col">
      <details className="ps-footer__accordion">
        <summary className="ps-footer__col-title">
          <h4>{title}</h4>
        </summary>
        <nav aria-label={title}>
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </details>
      <div className="ps-footer__col-desktop">
        <h4>{title}</h4>
        <nav aria-label={title}>
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** Pie de página premium del sitio público. */
export function PublicFooter() {
  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [newsMsg, setNewsMsg] = useState('');

  const visibleSocial = SOCIAL.filter((s) => publicSocialLinks[s.key]?.trim());

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const err = email(newsEmail);
    if (err) {
      setNewsStatus('err');
      setNewsMsg(err);
      return;
    }
    setNewsStatus('ok');
    setNewsMsg('Gracias. Te avisaremos con novedades para tu clínica.');
    setNewsEmail('');
  }

  return (
    <footer className="ps-footer ps-footer--premium">
      <div className="ps-shell ps-shell--wide">
        <div className="ps-footer__main">
          <div className="ps-footer__brand">
            <a href="/" className="ps-footer__logo" aria-label="Dentista+ — Inicio">
              <DentistaWebpLockup placement="footer" />
            </a>
            <p className="ps-footer__tag">Tu clínica digital</p>
            <p className="ps-footer__desc">
              La plataforma dental para gestionar clínicas con portal paciente, agenda, informes, documentos y
              facturación con la seguridad que merece tu consulta.
            </p>
            {visibleSocial.length > 0 ? (
              <div className="ps-footer__social" aria-label="Redes sociales">
                {visibleSocial.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={publicSocialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="ps-footer__columns">
            {publicFooterColumns.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>

          <aside className="ps-footer__contact-card" aria-labelledby="ps-footer-contact-title">
            <h3 id="ps-footer-contact-title">¿Tienes dudas?</h3>
            <p>Te ayudamos a elegir el plan adecuado para tu clínica.</p>
            <a href="/contacto?tipo=soporte" className="ps-btn ps-btn--footer-primary">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Hablar con soporte
            </a>
            <form className="ps-footer__newsletter" onSubmit={subscribe} noValidate>
              <label className="sr-only" htmlFor="ps-footer-news-email">
                Email para novedades
              </label>
              <Input
                id="ps-footer-news-email"
                type="email"
                placeholder="tu@email.com"
                value={newsEmail}
                onChange={(e) => {
                  setNewsEmail(e.target.value);
                  if (newsStatus !== 'idle') setNewsStatus('idle');
                }}
                autoComplete="email"
              />
              <button type="submit" className="ps-btn ps-btn--footer-outline">
                Suscribirme
              </button>
            </form>
            {newsStatus !== 'idle' ? (
              <p
                className={`ps-footer__news-msg${newsStatus === 'err' ? ' ps-footer__news-msg--err' : ''}`}
                role="status"
              >
                {newsMsg}
              </p>
            ) : null}
          </aside>
        </div>

        <div className="ps-footer__bottom">
          <span>© 2026 Dentista+. Todos los derechos reservados.</span>
          <nav className="ps-footer__bottom-nav" aria-label="Enlaces legales y utilidad">
            {publicFooterBottomLinks.map((l) => (
              <a key={l.href + l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
