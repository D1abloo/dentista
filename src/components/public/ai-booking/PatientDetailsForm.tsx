import type { FormEvent } from 'react'
import type { PatientFormErrors } from './patientValidation'
import type { PatientFormValue } from './types'

type Props = {
  value: PatientFormValue
  errors?: PatientFormErrors | null
  onChange: (value: PatientFormValue) => void
  onSubmit: () => void
  loading?: boolean
}

export function PatientDetailsForm({ value, errors, onChange, onSubmit, loading = false }: Props) {
  const update = (next: Partial<PatientFormValue>) => onChange({ ...value, ...next })
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="ai-patient-form" onSubmit={handleSubmit} aria-label="Tus datos">
      <h3 className="ai-patient-form__title">Tus datos</h3>

      <label className="ai-field">
        <span>Nombre completo</span>
        <input
          required
          value={value.fullName}
          onChange={(event) => update({ fullName: event.target.value })}
          aria-invalid={Boolean(errors?.fullName)}
        />
        {errors?.fullName ? <em className="ai-field__error">{errors.fullName}</em> : null}
      </label>

      <label className="ai-field">
        <span>Email</span>
        <input
          required
          type="email"
          value={value.email}
          onChange={(event) => update({ email: event.target.value })}
          aria-invalid={Boolean(errors?.email)}
        />
        {errors?.email ? <em className="ai-field__error">{errors.email}</em> : null}
      </label>

      <label className="ai-field">
        <span>Teléfono</span>
        <input
          required
          value={value.phone}
          onChange={(event) => update({ phone: event.target.value })}
          aria-invalid={Boolean(errors?.phone)}
        />
        {errors?.phone ? <em className="ai-field__error">{errors.phone}</em> : null}
      </label>

      <label className="ai-field">
        <span>DNI/NIE (opcional)</span>
        <input value={value.dni} onChange={(event) => update({ dni: event.target.value })} />
      </label>

      <label className="ai-field">
        <span>Motivo adicional (opcional)</span>
        <textarea
          rows={2}
          value={value.notes}
          onChange={(event) => update({ notes: event.target.value })}
        />
      </label>

      <button type="submit" disabled={loading} className="ai-btn ai-btn--primary ai-patient-form__submit">
        {loading ? 'Comprobando…' : 'Continuar'}
      </button>
    </form>
  )
}
