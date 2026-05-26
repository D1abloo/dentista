import type { ChatEntry } from './types'

type Props = {
  message: ChatEntry
}

export function ChatMessage({ message }: Props) {
  const isAssistant = message.role === 'assistant'
  return (
    <article
      className={`ai-msg${isAssistant ? ' ai-msg--assistant' : ' ai-msg--user'}`}
      aria-label={isAssistant ? 'Mensaje del asistente' : 'Tu mensaje'}
    >
      <p>{message.text}</p>
    </article>
  )
}
