import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

const SUGGESTIONS = [
  'Quiero pedir cita para una limpieza dental.',
  'Necesito cita esta semana por la tarde.',
  '¿Hay hueco mañana con la Dra. Ana?'
]

export function AiBookingWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <aside className="w-[min(94vw,22rem)] rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Asistente de citas</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
              aria-label="Cerrar asistente de citas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
          </p>
          <div className="mt-3 rounded-xl bg-sky-50 p-2 text-xs text-slate-700">
            Hola, soy el asistente de AgendaClinic. Puedo ayudarte a reservar una cita. ¿Qué tratamiento necesitas?
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu consulta…"
              aria-label="Mensaje para el asistente"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <a
              href={`/reservar-con-ia${input ? `?q=${encodeURIComponent(input)}` : ''}`}
              className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white"
            >
              Abrir
            </a>
          </div>
        </aside>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-xl"
        aria-expanded={open}
        aria-label="Reservar cita"
      >
        <MessageCircle className="h-4 w-4" />
        Reservar cita
      </button>
    </div>
  )
}
