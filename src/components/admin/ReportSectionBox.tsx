import type { ReactNode } from 'react';
import { Textarea } from '@/components/ui';

type ReportSectionBoxProps = {
  step?: string;
  title: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  wide?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'legal' | 'compact' | 'framed';
  children?: ReactNode;
};

export function ReportSectionBox({
  step,
  title,
  hint,
  value,
  onChange,
  rows = 3,
  required,
  wide,
  disabled,
  variant = 'framed',
  children
}: ReportSectionBoxProps) {
  const compact = variant === 'compact';
  const framed = variant === 'framed';
  return (
    <label
      className={`cr-field${compact ? ' cr-field--compact' : ''}${framed ? ' cr-field--framed' : ''}${variant === 'legal' ? ' cr-field--legal' : ''}${wide ? ' cr-field--wide' : ''}`}
    >
      <span className="cr-field__label">
        {step && !compact ? <span className="cr-field__step">{step}</span> : null}
        {title}
        {required ? <span className="cr-field__req">*</span> : null}
      </span>
      {hint && !compact ? <span className="cr-field__hint">{hint}</span> : null}
      {children ?? (
        <Textarea
          className="cr-field__input"
          rows={rows}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={compact ? 'Escribir…' : `Escribe aquí: ${title.toLowerCase()}…`}
        />
      )}
    </label>
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
      {title ? (
        <header className="cr-section-group__head">
          <h3 className="cr-section-group__title">{title}</h3>
          {subtitle ? <p className="cr-section-group__subtitle">{subtitle}</p> : null}
        </header>
      ) : null}
      <div className="cr-section-group__grid">{children}</div>
    </section>
  );
}
