import { brandImages } from '@/lib/brand/assets';
import {
  BRAND_LOGO_ALT,
  BRAND_NAME,
  BRAND_TAGLINE_CLINIC,
  BRAND_TAGLINE_PUBLIC,
  brandTagline,
  type BrandContext
} from '@/lib/brand/identity';

export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`dentista-webp-lockup__mark brand-logo-shine ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={brandImages.logo}
        alt={BRAND_LOGO_ALT}
        width={size}
        height={size}
        className="dentista-webp-lockup__img brand-logo-shine__img"
        decoding="async"
      />
    </span>
  );
}

export function LogoWordmark({
  theme = 'light',
  context = 'public'
}: {
  theme?: 'light' | 'dark';
  context?: BrandContext;
}) {
  const main = theme === 'dark' ? 'text-white' : 'text-dental-950';
  const sub = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const tag =
    context === 'clinic' ? BRAND_TAGLINE_CLINIC : context === 'patient' ? brandTagline('patient') : BRAND_TAGLINE_PUBLIC;

  return (
    <span className="min-w-0 leading-tight">
      <span className={`block font-display text-xl tracking-tight ${main}`}>{BRAND_NAME}</span>
      <span className={`block text-[11px] font-bold uppercase tracking-[0.14em] ${sub}`}>{tag}</span>
    </span>
  );
}

export function Logo({
  theme = 'light',
  size = 44,
  context = 'public'
}: {
  theme?: 'light' | 'dark';
  size?: number;
  context?: BrandContext;
}) {
  return (
    <span className="brand-logo-lockup dentista-webp-lockup inline-flex items-center gap-3">
      <LogoMark size={size} />
      <LogoWordmark theme={theme} context={context} />
    </span>
  );
}

export { DentistaWebpLockup, AgendaClinicLockup } from '@/components/brand/DentistaWebpLogo';
