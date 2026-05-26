import type { FormEvent } from 'react'
import type { PatientFormValue } from './types'

type Props = {
  value: PatientFormValue
  onChange: (value: PatientFormValue) => void
  onSubmit: () => void
  loading: boolean
}

export function PatientDetailsForm({ value, onChange, onSubmit, loading }: Props) {
  const update = (next: Partial<PatientFormValue>) => onChange({ ...value, ...next })
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" onSubmit={handleSubmit}>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Nombre completo
        <input
          required
          value={value.fullName}
          onChange={(event) => update({ fullName: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Email
        <input
          required
          type="email"
          value={value.email}
          onChange={(event) => update({ email: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Teléfono
        <input
          required
          value={value.phone}
          onChange={(event) => update({ phone: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        DNI/NIE (opcional)
        <input
          value={value.dni}
          onChange={(event) => update({ dni: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Motivo de la cita
        <input
          required
          value={value.reason}
          onChange={(event) => update({ reason: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Notas (opcional)
        <textarea
          rows={3}
          value={value.notes}
          onChange={(event) => update({ notes: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-700">
          ¿Ya tienes cuenta en el Portal del Paciente?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update({ hasPortalAccount: true })}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${value.hasPortalAccount === true ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Sí, iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => update({ hasPortalAccount: false })}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${value.hasPortalAccount === false ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            No, continuar como nuevo paciente
          </button>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? 'Preparando la reserva…' : 'Continuar'}
      </button>
    </form>
  )
}
