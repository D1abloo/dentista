const HELP_ITEMS = [
  'Reservar una cita',
  'Buscar el primer hueco disponible',
  'Elegir profesional',
  'Cambiar fecha u horario',
  'Resolver dudas antes de reservar'
]

export function AiHelpContextCard() {
  return (
    <aside className="ai-help-card" aria-label="Ayuda del asistente">
      <h3 className="ai-help-card__title">Puedo ayudarte con:</h3>
      <ul className="ai-help-card__list">
        {HELP_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  )
}
