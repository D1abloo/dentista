import type { ReactNode } from 'react';
import { Textarea } from '@/components/ui';

type ReportSectionBoxProps = {
  step: string;
  title: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  variant?: 'default' | 'legal' | 'compact';
  children?: ReactNode;
};

export function ReportSectionBox({
  step,
  title,
  hint,
  value,
  onChange,
  rows = 5,
  required,
  variant = 'default',
  children
}: ReportSectionBoxProps) {
  return (
    <article className={`cr-section-box cr-section-box--${variant}`}>
      <header className="cr-section-box__head">
        <span className="cr-section-box__step" aria-hidden>
          {step}
        </span>
        <div className="cr-section-box__titles">
          <h4 className="cr-section-box__title">
            {title}
            {required ? <span className="cr-section-box__req">*</span> : null}
          </h4>
          {hint ? <p className="cr-section-box__hint">{hint}</p> : null}
        </div>
      </header>
      <div className="cr-section-box__body">
        {children ?? (
          <Textarea
            className="cr-textarea cr-section-box__input"
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Escribe aquí: ${title.toLowerCase()}…`}
          />
        )}
      </div>
    </article>
  );
}

export function ReportSectionGroup({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="cr-section-group">
      <header className="cr-section-group__head">
        <h3 className="cr-section-group__title">{title}</h3>
        {subtitle ? <p className="cr-section-group__subtitle">{subtitle}</p> : null}
      </header>
      <div className="cr-section-group__grid">{children}</div>
    </section>
  );
}
