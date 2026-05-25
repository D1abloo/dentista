import { brandImages } from '@/lib/brand/assets';
import { BRAND_LOGO_ALT, BRAND_NAME, brandTagline, type BrandContext } from '@/lib/brand/identity';

export function DentistaWebpLockup({
  placement = 'header',
  showWordmark = true,
  context = 'public'
}: {
  placement?: 'header' | 'footer';
  showWordmark?: boolean;
  context?: BrandContext;
}) {
  const tag = brandTagline(context === 'footer' ? 'footer' : context);

  return (
    <span className={`dentista-webp-lockup dentista-webp-lockup--${placement}`}>
      <span className="dentista-webp-lockup__mark" aria-hidden={showWordmark}>
        <img
          src={brandImages.logo}
          alt={showWordmark ? '' : BRAND_LOGO_ALT}
          className="dentista-webp-lockup__img"
          width={48}
          height={48}
          decoding="async"
        />
      </span>
      {showWordmark ? (
        <span className="dentista-webp-lockup__text">
          <span className="dentista-webp-lockup__name">{BRAND_NAME}</span>
          <span className="dentista-webp-lockup__tag">{tag}</span>
        </span>
      ) : null}
    </span>
  );
}

/** Alias explícito para nuevos imports. */
export const AgendaClinicLockup = DentistaWebpLockup;
