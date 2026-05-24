const LOGO_WEBP = '/images/logo.webp';

export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`dentista-webp-lockup__mark brand-logo-shine ${className}`} style={{ width: size, height: size }}>
      <img
        src={LOGO_WEBP}
        alt="Dentista+"
        width={size}
        height={size}
        className="dentista-webp-lockup__img brand-logo-shine__img"
        decoding="async"
      />
    </span>
  );
}

export function LogoWordmark({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const main = theme === 'dark' ? 'text-white' : 'text-dental-950';
  const sub = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  return (
    <span className="min-w-0 leading-tight">
      <span className={`block font-display text-xl tracking-tight ${main}`}>Dentista+</span>
      <span className={`block text-[11px] font-bold uppercase tracking-[0.14em] ${sub}`}>Citas dentales</span>
    </span>
  );
}

export function Logo({ theme = 'light', size = 44 }: { theme?: 'light' | 'dark'; size?: number }) {
  return (
    <span className="brand-logo-lockup dentista-webp-lockup inline-flex items-center gap-3">
      <LogoMark size={size} />
      <LogoWordmark theme={theme} />
    </span>
  );
}

export { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
