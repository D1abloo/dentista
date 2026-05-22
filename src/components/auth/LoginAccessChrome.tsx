import { ArrowLeft } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

export function LoginAccessBar({
  backHref = '/',
  backLabel = 'Inicio',
  badge
}: {
  backHref?: string;
  backLabel?: string;
  badge?: string;
}) {
  return (
    <header className="login-access-bar">
      <a href="/" className="login-access-bar__brand">
        <DentistaWebpLockup placement="header" />
      </a>
      {badge ? <span className="login-access-bar__badge">{badge}</span> : null}
      <a href={backHref} className="login-access-bar__back">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </a>
    </header>
  );
}

export function LoginAccessFoot({
  links
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <nav className="login-access-foot" aria-label="Enlaces de acceso">
      {links.map((l) => (
        <a key={l.href} href={l.href}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
