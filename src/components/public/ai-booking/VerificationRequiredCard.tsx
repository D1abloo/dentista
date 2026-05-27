type Props = {
  onVerify: () => void
  onLogin: () => void
}

export function VerificationRequiredCard({ onVerify, onLogin }: Props) {
  return (
    <section className="ai-verify-card" aria-label="Verificación adicional requerida">
      <h3 className="ai-verify-card__title">Verificación adicional</h3>
      <p className="ai-verify-card__text">
        Para proteger tus datos, necesitamos verificar tu identidad antes de cancelar o cambiar una cita.
      </p>
      <div className="ai-verify-card__actions">
        <button type="button" className="ai-btn ai-btn--primary" onClick={onVerify}>
          Verificar con email y teléfono
        </button>
        <a href="/login/paciente?next=/citas-con-ia" className="ai-btn ai-btn--secondary" onClick={onLogin}>
          Iniciar sesión en el portal
        </a>
      </div>
    </section>
  )
}
