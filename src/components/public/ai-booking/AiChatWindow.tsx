import type { ReactNode } from 'react'
import { Bot } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { QuickReplyChips } from './QuickReplyChips'
import type { AssistantUiState, ChatEntry } from './types'

type Props = {
  messages: ChatEntry[]
  quickReplies: string[]
  chatInput: string
  status: AssistantUiState
  onInputChange: (value: string) => void
  onSend: (value: string) => void
  onQuickReply: (value: string) => void
  footer?: ReactNode
  variant?: 'page' | 'widget'
  inputId?: string
}

const STATUS_LABEL: Partial<Record<AssistantUiState, string>> = {
  thinking: 'Pensando…',
  asking_followup: 'Pensando…',
  fetching_availability: 'Buscando huecos disponibles…',
  booking: 'Reservando cita…'
}

export function AiChatWindow({
  messages,
  quickReplies,
  chatInput,
  status,
  onInputChange,
  onSend,
  onQuickReply,
  footer,
  variant = 'page',
  inputId = 'ai-booking-input'
}: Props) {
  const statusLabel = STATUS_LABEL[status]
  const isWidget = variant === 'widget'

  return (
    <article
      className={
        isWidget
          ? 'ai-widget__chat flex min-h-0 flex-1 flex-col'
          : 'ai-page__card ai-page__chat flex min-h-[62vh] flex-col rounded-3xl p-4'
      }
    >
      {!isWidget ? (
        <header className="mb-3 flex items-center gap-3 border-b border-slate-200/70 pb-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <Bot className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Asistente de citas</h2>
            <p className="text-xs text-slate-600">Te ayudamos a reservar tu cita en pocos pasos.</p>
          </div>
        </header>
      ) : null}

      <div
        className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <QuickReplyChips options={quickReplies} onSelect={onQuickReply} />
      </div>

      <label htmlFor={inputId} className="sr-only">
        Mensaje para el asistente de citas
      </label>
      <div className={`${isWidget ? 'ai-widget__inputRow' : 'ai-page__stickyInput'} mt-3 flex gap-2`}>
        <input
          id={inputId}
          value={chatInput}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Escribe, por ejemplo: quiero una limpieza dental esta semana…"
          className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-200/60"
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSend(chatInput)
          }}
        />
        <button
          type="button"
          onClick={() => onSend(chatInput)}
          disabled={status === 'thinking' || status === 'booking' || status === 'fetching_availability'}
          className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Enviar
        </button>
      </div>

      {statusLabel ? (
        <p className="mt-3 text-xs font-semibold text-slate-600" role="status">
          {statusLabel}
        </p>
      ) : null}

      {footer}
    </article>
  )
}
