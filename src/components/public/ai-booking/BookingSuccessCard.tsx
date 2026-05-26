type Props = {
  hasPortalAccount: boolean
  onBookAnother: () => void
}

export function BookingSuccessCard({ hasPortalAccount, onBookAnother }: Props) {
  return (
    <article className="rounded-2xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200">
      <h3 className="text-base font-semibold text-emerald-800">Cita reservada correctamente.</h3>
      <p className="mt-2 text-sm text-emerald-900">
        Te hemos enviado la confirmación por email. También podrás verla en tu Portal del Paciente cuando actives tu cuenta.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={hasPortalAccount ? '/login?next=/paciente/citas' : '/registro-paciente'}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Ir al Portal del Paciente
        </a>
        <button
          type="button"
          onClick={onBookAnother}
          className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Reservar otra cita
        </button>
        <button
          type="button"
          className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Añadir al calendario
        </button>
      </div>
    </article>
  )
}
