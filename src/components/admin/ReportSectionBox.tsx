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
  variant?: 'default' | 'legal' | 'compact';
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
  variant = 'compact',
  children
}: ReportSectionBoxProps) {
  const compact = variant === 'compact';
  return (
    <label className={`cr-field${compact ? ' cr-field--compact' : ''}${variant === 'legal' ? ' cr-field--legal' : ''}`}>
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
