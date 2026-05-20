import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/brand/Logo';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';

export type PortalLoginVariant = 'admin' | 'patient' | 'hub';

export function PortalLoginShell({
  variant,
  eyebrow,
  title,
  lead,
  children,
  footer
}: {
  variant: PortalLoginVariant;
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const shellRef = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: px * 12, y: py * 8 });
    };

    const onLeave = () => setTilt({ x: 0, y: 0 });

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const imgTransform = `translate(${tilt.x * -0.5}px, ${tilt.y * -0.5}px) scale(1.06)`;

  return (
    <main
      ref={shellRef}
      className={`login-portal login-portal--${variant} ${entered ? 'login-portal--ready' : ''}`}
    >
      <div className="login-portal__bg" aria-hidden>
        <img
          src={HERO_IMAGE}
          alt=""
          className="login-portal__bg-img"
          style={{ transform: imgTransform }}
          loading="eager"
          decoding="async"
        />
        <div className="login-portal__bg-orb login-portal__bg-orb--1" />
        <div className="login-portal__bg-orb login-portal__bg-orb--2" />
        <div className="login-portal__bg-orb login-portal__bg-orb--3" />
        <div className="login-portal__bg-vignette" />
        <div className="login-portal__bg-grain" />
      </div>

      <div className="login-portal__stage">
        <article
          className="login-portal__card"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.y * -0.3}deg) rotateY(${tilt.x * 0.3}deg)`
          }}
        >
          <div className="login-portal__card-glow" aria-hidden />
          <header className="login-portal__head">
            <div className="login-portal__logo">
              <LogoMark size={variant === 'admin' ? 48 : variant === 'hub' ? 56 : 52} />
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
