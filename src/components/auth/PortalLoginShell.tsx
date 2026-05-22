import { useEffect, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { LoginAccessBar } from './LoginAccessChrome';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';

export type PortalLoginVariant = 'admin' | 'patient' | 'hub';

export function PortalLoginShell({
  variant,
  eyebrow,
  title,
  lead,
  children,
  footer,
  barBadge,
  backHref = '/login',
  backLabel = 'Elegir portal'
}: {
  variant: PortalLoginVariant;
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  footer: ReactNode;
  barBadge?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className={`login-portal login-portal--${variant} ${entered ? 'login-portal--ready' : ''}`}>
      <LoginAccessBar backHref={backHref} backLabel={backLabel} badge={barBadge} />

      <div className="login-portal__bg" aria-hidden>
        <img src={HERO_IMAGE} alt="" className="login-portal__bg-img" loading="eager" decoding="async" />
        <div className="login-portal__bg-orb login-portal__bg-orb--1" />
        <div className="login-portal__bg-orb login-portal__bg-orb--2" />
        <div className="login-portal__bg-vignette" />
      </div>

      <div className="login-portal__stage">
        <article className="login-portal__card">
          <div className="login-portal__card-glow" aria-hidden />
          <header className="login-portal__head">
            <div className="login-portal__logo">
              <LogoMark size={variant === 'hub' ? 52 : 48} />
            </div>
            <div>
              <p className="login-portal__eyebrow">{eyebrow}</p>
              <h1 className="login-portal__title">{title}</h1>
              <p className="login-portal__lead">{lead}</p>
            </div>
          </header>

          <div className="login-portal__body">{children}</div>

          <footer className="login-portal__foot">{footer}</footer>
        </article>
      </div>
    </main>
  );
}
