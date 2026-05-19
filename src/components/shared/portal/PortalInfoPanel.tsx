import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Variant = 'patient' | 'admin' | 'neutral' | 'privacy';

const tone: Record<Variant, string> = {
  patient: 'portal-info--patient',
  admin: 'portal-info--admin',
  neutral: 'portal-info--neutral',
  privacy: 'portal-info--privacy'
};

export function PortalInfoPanel({
  title,
  icon: Icon,
  variant = 'neutral',
  children
}: {
  title: string;
  icon?: LucideIcon;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <section className={`portal-info ${tone[variant]}`}>
      <div className="portal-info__head">
        {Icon ? <Icon className="portal-info__icon" aria-hidden /> : null}
        <h3 className="portal-info__title">{title}</h3>
      </div>
      <div className="portal-info__body">{children}</div>
    </section>
  );
}
