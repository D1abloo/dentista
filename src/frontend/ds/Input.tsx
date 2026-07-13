import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/frontend/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  requiredMark?: boolean
  leftSlot?: ReactNode
  rightSlot?: ReactNode
}

export const Input = ({
  id,
  label,
  hint,
  error,
  requiredMark,
  leftSlot,
  rightSlot,
  className,
  required,
  ...props
}: InputProps) => {
  const inputId = id ?? props.name
  const describedBy = [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
          {label}
          {requiredMark || required ? (
            <span className="ml-0.5 text-red-600" aria-hidden>
              *
            </span>
          ) : null}
          {requiredMark || required ? <span className="sr-only"> (obligatorio)</span> : null}
        </label>
      ) : null}
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-xl border bg-white px-3 transition-colors',
          error
            ? 'border-red-400 ring-1 ring-red-200'
            : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25'
        )}
      >
        {leftSlot}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400',
            'focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
        {rightSlot}
      </div>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
