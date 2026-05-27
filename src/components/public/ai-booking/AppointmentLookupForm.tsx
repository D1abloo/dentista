type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading?: boolean
  error?: string
  compact?: boolean
}

export function AppointmentLookupForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  error,
  compact = false
}: Props) {
  const inputId = compact ? 'ai-lookup-identifier-widget' : 'ai-lookup-identifier-page'

  return (
    <section
      className={`ai-lookup${compact ? ' ai-lookup--compact' : ''}`}
      aria-label="Consulta rápida de citas"
    >
      <h3 className="ai-lookup__title">Consulta rápida de citas</h3>
      <p className="ai-lookup__text">
        Introduce tu email, DNI o NHC para saber si tienes una cita próxima.
      </p>

      <label className="ai-field" htmlFor={inputId}>
        <span>Email, DNI o NHC</span>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Email, DNI o NHC"
          autoComplete="username"
          inputMode="text"
        />
      </label>

      {error ? (
        <p className="ai-lookup__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="ai-btn ai-btn--primary ai-lookup__submit"
        onClick={onSubmit}
        disabled={loading || !value.trim()}
      >
        {loading ? 'Buscando tus citas…' : 'Buscar mis citas'}
      </button>

      <p className="ai-lookup__note">
        Solo mostramos información básica de la cita. Para informes, facturas o documentos, inicia sesión en el
        Portal del Paciente.
      </p>
    </section>
  )
}
