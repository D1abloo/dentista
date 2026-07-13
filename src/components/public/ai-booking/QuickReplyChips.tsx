import type { SuggestedOption, SuggestedOptionKind } from '@/lib/ai/suggestedOptions'
import {
  Building2,
  Calendar,
  HelpCircle,
  List,
  Sparkles,
  Stethoscope,
  Sun,
  UserRound,
  type LucideIcon
} from 'lucide-react'
import type { QuickReplyItem } from './quickReplies'

const KIND_ICON: Record<SuggestedOptionKind, LucideIcon> = {
  intent: Sparkles,
  treatment: Stethoscope,
  professional: UserRound,
  clinic: Building2,
  date: Calendar,
  time: Sun,
  manage: List,
  help: HelpCircle
}

type Props = {
  options?: QuickReplyItem[]
  suggested?: SuggestedOption[]
  onSelect: (value: string) => void
  onSelectOption?: (option: SuggestedOption) => void
  disabled?: boolean
}

export function QuickReplyChips({
  options = [],
  suggested = [],
  onSelect,
  onSelectOption,
  disabled = false
}: Props) {
  const chips: Array<{ key: string; label: string; Icon: LucideIcon; option?: SuggestedOption; kind?: string }> =
    suggested.length
      ? suggested.map((option) => ({
          key: `${option.kind}-${option.label}`,
          label: option.label,
          Icon: KIND_ICON[option.kind] ?? Sparkles,
          option,
          kind: option.kind
        }))
      : options.map((option) => ({
          key: option.text,
          label: option.text,
          Icon: option.icon,
          kind: option.kind
        }))

  if (!chips.length) return null

  const handleClick = (chip: (typeof chips)[number]) => {
    if (chip.option && onSelectOption) {
      onSelectOption(chip.option)
      return
    }
    onSelect(chip.option?.message ?? chip.label)
  }

  return (
    <div className="ai-quick" role="list" aria-label="Opciones rápidas">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          disabled={disabled}
          onClick={() => handleClick(chip)}
          className={`ai-quick__chip${chip.kind ? ` ai-quick__chip--${chip.kind}` : ''}`}
        >
          <chip.Icon className="h-3.5 w-3.5" aria-hidden />
          {chip.label}
        </button>
      ))}
    </div>
  )
}
