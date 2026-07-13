import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'
import { Button } from './Button'

export const Modal = ({
  open,
  title,
  description,
  children,
  onClose,
  footer
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar diálogo"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nx-modal-title"
        aria-describedby={description ? 'nx-modal-desc' : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl',
          'max-h-[min(90dvh,720px)] overflow-y-auto'
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="nx-modal-title" className="font-display text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p id="nx-modal-desc" className="mt-1 text-sm text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer ? <footer className="border-t border-slate-100 px-5 py-4">{footer}</footer> : null}
      </div>
    </div>
  )
}
