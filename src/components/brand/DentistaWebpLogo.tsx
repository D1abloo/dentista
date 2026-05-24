const LOGO_SRC = '/images/logo.webp';

export function DentistaWebpLockup({
  placement = 'header',
  showWordmark = true
}: {
  placement?: 'header' | 'footer';
  showWordmark?: boolean;
}) {
  return (
    <span className={`dentista-webp-lockup dentista-webp-lockup--${placement}`}>
      <span className="dentista-webp-lockup__mark" aria-hidden>
        <img src={LOGO_SRC} alt="" className="dentista-webp-lockup__img" width={48} height={48} decoding="async" />
      </span>
      {showWordmark ? (
        <span className="dentista-webp-lockup__text">
          <span className="dentista-webp-lockup__name">Dentista+</span>
          <span className="dentista-webp-lockup__tag">Tu clínica digital</span>
        </span>
      ) : null}
    </span>
  );
}
