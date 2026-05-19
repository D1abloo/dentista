import type { ButtonHTMLAttributes, ReactNode } from 'react';

const tones = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  danger: 'ui-btn--danger',
  ghost: 'ui-btn--ghost'
} as const;

export function Button({
  tone = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <button type="button" className={`ui-btn ${tones[tone]} ${className}`} {...props}>
      {children}
    </button>
  );
}
