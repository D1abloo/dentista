import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

export function AiBookingWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  return (
    <div className="ai-widget">
      {open ? (
        <aside className="ai-widget__panel" role="dialog" aria-label="Asistente de citas">
          <div className="ai-widget__head">
            <div className="ai-widget__title">
              <strong>Asistente de citas</strong>
              <span>Te guiamos hasta confirmar tu reserva</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ai-widget__close"
              aria-label="Cerrar asistente de citas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="ai-widget__body">
            <p className="text-xs font-semibold text-slate-600">
              Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
            </p>
            <div className="ai-widget__hint">
              Hola, soy el asistente de AgendaClinic. Dime qué necesitas y buscaré una cita disponible para ti.
            </div>
            <div className="ai-widget__chips" aria-label="Sugerencias">
              {['Quiero reservar cita', 'Limpieza dental', 'Por la tarde'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="ai-widget__chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="ai-widget__row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu consulta…"
              aria-label="Mensaje para el asistente"
              className="ai-widget__input"
            />
            <a
              href={`/reservar-con-ia${input ? `?q=${encodeURIComponent(input)}` : ''}`}
              className="ai-widget__open"
            >
              Abrir
            </a>
            </div>
          </div>
        </aside>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ai-widget__btn"
        aria-expanded={open}
        aria-label="Reservar cita"
      >
        <MessageCircle className="h-4 w-4" />
        Reservar cita
      </button>
    </div>
  )
}
