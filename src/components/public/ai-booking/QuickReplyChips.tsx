import type { QuickReplyItem } from './quickReplies'

type Props = {
  options: QuickReplyItem[]
  onSelect: (value: string) => void
  disabled?: boolean
}

export function QuickReplyChips({ options, onSelect, disabled = false }: Props) {
  if (!options.length) return null
  return (
    <div className="ai-quick" role="list" aria-label="Respuestas rápidas">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.text}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.text)}
            className="ai-quick__chip"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {option.text}
          </button>
        )
      })}
    </div>
  )
}
