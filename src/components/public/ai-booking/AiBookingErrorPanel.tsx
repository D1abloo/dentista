type Props = {
  message?: string
  onRetry: () => void
}

export function AiBookingErrorPanel({ message, onRetry }: Props) {
  return (
    <section className="ai-error-panel" role="alert">
      <h3 className="ai-error-panel__title">No se pudo completar la reserva</h3>
      <p className="ai-error-panel__text">
        {message ??
          'Ha ocurrido un problema al comprobar la disponibilidad. Inténtalo de nuevo.'}
      </p>
      <div className="ai-error-panel__actions">
        <button type="button" className="ai-btn ai-btn--primary" onClick={onRetry}>
          Reintentar
        </button>
        <a href="/contacto" className="ai-btn ai-btn--ghost">
          Contactar soporte
        </a>
      </div>
    </section>
  )
}
