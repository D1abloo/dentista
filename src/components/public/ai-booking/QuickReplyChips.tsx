type Props = {
  options: string[]
  onSelect: (value: string) => void
}

export function QuickReplyChips({ options, onSelect }: Props) {
  if (!options.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Respuestas rápidas">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
