import type { ChatEntry } from './types'

type Props = {
  message: ChatEntry
}

export function ChatMessage({ message }: Props) {
  const isAssistant = message.role === 'assistant'
  return (
    <article
      className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isAssistant
          ? 'self-start bg-white text-slate-800 ring-1 ring-slate-200'
          : 'self-end bg-teal-700 text-white'
      }`}
      aria-label={isAssistant ? 'Mensaje del asistente' : 'Tu mensaje'}
    >
      <p>{message.text}</p>
    </article>
  )
}
