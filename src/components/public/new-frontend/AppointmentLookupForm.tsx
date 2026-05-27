type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading?: boolean
}

export function AppointmentLookupForm({ value, onChange, onSubmit, loading = false }: Props) {
  return (
    <section className="ac-lookup" aria-label="Consulta rápida de citas">
      <h3>Consulta rápida de citas</h3>
      <p>Introduce tu email, DNI o NHC para saber si tienes una cita próxima.</p>
      <label htmlFor="ac-lookup-input" className="ac-field">
        <span>Email, DNI o NHC</span>
        <input
          id="ac-lookup-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Email, DNI o NHC"
        />
      </label>
      <button type="button" className="ac-btn ac-btn--primary" onClick={onSubmit} disabled={loading || !value.trim()}>
        {loading ? 'Buscando tus citas…' : 'Consultar cita'}
      </button>
    </section>
  )
}
