import { getBookingContextRows } from './bookingSteps'
import type { BookingState } from './types'

type Props = {
  bookingState: BookingState
  collapsible?: boolean
}

export function BookingContextSummary({ bookingState, collapsible = false }: Props) {
  const rows = getBookingContextRows(bookingState)

  const content = (
    <dl className="ai-context__rows">
      {rows.map((row) => (
        <div key={row.key} className="ai-context__row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )

  if (collapsible) {
    return (
      <details className="ai-context ai-context--collapsible">
        <summary className="ai-context__title">Resumen de la reserva</summary>
        {content}
      </details>
    )
  }

  return (
    <section className="ai-context" aria-label="Resumen de la reserva">
      <h3 className="ai-context__title">Resumen de la reserva</h3>
      {content}
    </section>
  )
}
