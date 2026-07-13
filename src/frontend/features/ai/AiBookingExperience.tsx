import { useMemo, useState, type FormEvent } from 'react'
import { Bot, Send } from 'lucide-react'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { Alert, Button, Card, Input, Spinner } from '@/frontend/ds'
import { cn } from '@/frontend/lib/cn'

const TABS = [
  { id: 'book' as const, label: 'Nueva cita' },
  { id: 'manage' as const, label: 'Mis citas' }
]

const busy = (status: string) =>
  ['thinking', 'booking', 'fetching_availability', 'fetching_appointments', 'verifying_identity'].includes(
    status
  )

export const AiBookingExperience = ({ initialQuery }: { initialQuery?: string }) => {
  const flow = useAiAppointmentsFlow({ initialQuery })
  const [draft, setDraft] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy(flow.status)) return
    setDraft('')
    void flow.handleSendMessage(text)
  }

  const slotPreview = useMemo(() => flow.slots.slice(0, flow.showAllSlots ? 20 : 6), [flow.slots, flow.showAllSlots])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="flex min-h-[480px] flex-col">
        <div className="flex gap-2 border-b border-slate-100 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => flow.handleTabChange(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-semibold',
                flow.activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-4" aria-live="polite">
          {flow.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[90%] rounded-2xl px-4 py-2 text-sm',
                msg.role === 'assistant' ? 'bg-slate-100 text-slate-800' : 'ml-auto bg-brand-600 text-white'
              )}
            >
              {msg.text}
            </div>
          ))}
          {busy(flow.status) ? <Spinner label="Procesando…" className="py-4" /> : null}
        </div>

        {flow.suggestedOptions.length ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {flow.suggestedOptions.map((opt) => (
              <button
                key={`${opt.kind}-${opt.label}`}
                type="button"
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800"
                onClick={() => void flow.handleSelectOption(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <Input
            id="ai-chat-input"
            aria-label="Mensaje para el asistente"
            placeholder="Escribe tu mensaje…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy(flow.status)}
            className="flex-1"
          />
          <Button type="submit" disabled={busy(flow.status)} aria-label="Enviar">
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>

        {flow.errorMessage ? <Alert tone="danger" className="mt-3">{flow.errorMessage}</Alert> : null}
      </Card>

      <aside className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Bot className="h-4 w-4" aria-hidden />
            Disponibilidad real
          </div>
          <p className="mt-2 text-xs text-slate-600">Huecos verificados en PostgreSQL. Sin inventar citas.</p>
        </Card>

        {slotPreview.length ? (
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-ink">Huecos disponibles</h3>
            <ul className="mt-3 space-y-2">
              {slotPreview.map((slot) => (
                <li key={slot.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-400"
                    onClick={() => void flow.handleSelectSlot(slot)}
                  >
                    {slot.date} · {slot.time}
                    <span className="block text-xs text-slate-500">{slot.professionalName}</span>
                  </button>
                </li>
              ))}
            </ul>
            {flow.slots.length > 6 ? (
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => flow.setShowAllSlots(true)}>
                Ver más
              </Button>
            ) : null}
          </Card>
        ) : null}

        {flow.selectedSlot ? (
          <Card>
            <h3 className="text-sm font-semibold">Resumen</h3>
            <p className="mt-2 text-sm text-slate-600">
              {flow.selectedSlot.date} {flow.selectedSlot.time}
            </p>
            <Button className="mt-3 w-full" size="sm" onClick={() => void flow.handleConfirmBooking()}>
              Confirmar reserva
            </Button>
          </Card>
        ) : null}
      </aside>
    </div>
  )
}
