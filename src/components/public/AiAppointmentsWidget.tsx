import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { AI_WIDGET_OPEN_EVENT, isAiWidgetHiddenPath } from '@/lib/public/aiWidget'

export function AiAppointmentsWidget() {
  const [open, setOpen] = useState(false)
  const [pathname, setPathname] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const flow = useAiAppointmentsFlow()

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(AI_WIDGET_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(AI_WIDGET_OPEN_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointer)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const mobile = window.matchMedia('(max-width: 640px)').matches
    if (!mobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (isAiWidgetHiddenPath(pathname)) return null

  const handleToggle = () => setOpen((value) => !value)

  return (
    <div ref={rootRef} className={`ai-widget${open ? ' ai-widget--open' : ''}${flow.slots.length ? ' ai-widget--calendar' : ''}`}>
      {open ? (
        <>
          <button
            type="button"
            className="ai-widget__backdrop"
            aria-label="Cerrar asistente de citas"
            onClick={() => setOpen(false)}
          />
          <aside
            id="ai-widget-panel"
            className="ai-widget__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Asistente de citas"
          >
            <header className="ai-widget__panel-head">
              <div className="ai-widget__panel-brand">
                <span className="ai-widget__panel-icon" aria-hidden>
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <strong>Asistente de citas</strong>
                  <span>Reserva, consulta o cambia tu cita</span>
                </div>
              </div>
              <button
                type="button"
                className="ai-widget__panel-close"
                aria-label="Cerrar panel"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>
            <div className="ai-widget__panel-body">
              <AiAppointmentsAssistant
                variant="widget"
                flow={flow}
                inputId="ai-widget-appointments-input"
                showHeader={false}
                onClose={() => setOpen(false)}
              />
            </div>
          </aside>
        </>
      ) : null}

      <button
        type="button"
        onClick={handleToggle}
        className="ai-widget__btn"
        aria-expanded={open}
        aria-controls="ai-widget-panel"
        aria-label={open ? 'Ocultar asistente de citas' : 'Abrir asistente de citas'}
      >
        <span className="ai-widget__pulse" aria-hidden />
        <Calendar className="h-4 w-4" aria-hidden />
        <span className="ai-widget__btn-label">Reservar cita</span>
        <ChevronDown className={`ai-widget__chev${open ? ' ai-widget__chev--open' : ''}`} aria-hidden />
      </button>
    </div>
  )
}

export const AiBookingWidget = AiAppointmentsWidget
