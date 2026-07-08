import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({
  label,
  error,
  className,
  children
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={['df-field grid gap-1.5 text-sm font-semibold text-slate-700', className].filter(Boolean).join(' ')}>
      <span className="df-field__label">{label}</span>
      {children}
      {error ? <span className="df-field__error" role="alert">{error}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field-control" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field-control" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field-control min-h-[96px]" {...props} />;
}
