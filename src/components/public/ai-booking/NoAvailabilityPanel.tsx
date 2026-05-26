type Props = {
  onSearchOtherDay: () => void
  onSearchOtherProfessional: () => void
  onFirstAvailable: () => void
  onContactClinic: () => void
}

export function NoAvailabilityPanel({
  onSearchOtherDay,
  onSearchOtherProfessional,
  onFirstAvailable,
  onContactClinic
}: Props) {
  return (
    <section className="ai-empty" aria-label="Sin huecos disponibles">
      <h3 className="ai-empty__title">No hay huecos con esos filtros</h3>
      <p className="ai-empty__text">
        Puedo buscar otro día, otro profesional o la primera cita disponible.
      </p>
      <div className="ai-empty__actions">
        <button type="button" className="ai-btn ai-btn--secondary" onClick={onSearchOtherDay}>
          Buscar otro día
        </button>
        <button type="button" className="ai-btn ai-btn--secondary" onClick={onSearchOtherProfessional}>
          Buscar otro profesional
        </button>
        <button type="button" className="ai-btn ai-btn--primary" onClick={onFirstAvailable}>
          Primer hueco disponible
        </button>
        <a href="/contacto" className="ai-btn ai-btn--ghost">
          Contactar con la clínica
        </a>
      </div>
    </section>
  )
}
