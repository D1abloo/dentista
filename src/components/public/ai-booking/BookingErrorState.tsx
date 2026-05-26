type Props = {
  message: string
}

export function BookingErrorState({ message }: Props) {
  return (
    <article className="rounded-2xl bg-rose-50 p-4 shadow-sm ring-1 ring-rose-200">
      <h3 className="text-base font-semibold text-rose-800">No se pudo reservar la cita.</h3>
      <p className="mt-1 text-sm text-rose-900">{message}</p>
    </article>
  )
}
