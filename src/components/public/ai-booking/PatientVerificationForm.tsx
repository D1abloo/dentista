type Props = {
  email: string
  phone: string
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onVerify: () => void
  onLogin: () => void
  onSecureLink: () => void
  loading?: boolean
  error?: string
}

export function PatientVerificationForm({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
  onVerify,
  onLogin,
  onSecureLink,
  loading = false,
  error
}: Props) {
  return (
    <section className="ai-verify" aria-label="Identificación del paciente">
      <h3 className="ai-verify__title">Identificación</h3>
      <p className="ai-verify__text">
        Para proteger tus datos, necesitamos verificar tu identidad antes de continuar. Introduce el email y el
        teléfono asociados a tu ficha o inicia sesión en el Portal del Paciente.
      </p>

      <div className="ai-verify__options">
        <a href="/login/paciente?next=/citas-con-ia" className="ai-btn ai-btn--primary" onClick={onLogin}>
          Iniciar sesión
        </a>
        <button type="button" className="ai-btn ai-btn--secondary" onClick={onSecureLink} disabled={loading}>
          Enviar enlace seguro
        </button>
      </div>

      <p className="ai-verify__divider">o usa email y teléfono</p>

      <label className="ai-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </label>
      <label className="ai-field">
        <span>Teléfono</span>
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          required
        />
      </label>

      {error ? <p className="ai-verify__error" role="alert">{error}</p> : null}

      <button
        type="button"
        className="ai-btn ai-btn--primary ai-verify__submit"
        onClick={onVerify}
        disabled={loading}
      >
        {loading ? 'Verificando…' : 'Usar email y teléfono'}
      </button>
    </section>
  )
}
