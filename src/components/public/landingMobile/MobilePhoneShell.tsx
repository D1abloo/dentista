import type { ReactNode } from 'react';

type Props = {
  alt: string;
  children: ReactNode;
  className?: string;
};

/** Marco decorativo de teléfono (sin controles interactivos). */
export function MobilePhoneShell({ alt, children, className = '' }: Props) {
  return (
    <figure
      className={`ps-phone${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={alt}
    >
      <div className="ps-phone__bezel">
        <div className="ps-phone__status" aria-hidden>
          <span className="ps-phone__time">9:41</span>
          <span className="ps-phone__island" />
          <span className="ps-phone__signal" />
        </div>
        <div className="ps-phone__screen">{children}</div>
      </div>
    </figure>
  );
}
