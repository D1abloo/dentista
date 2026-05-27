type Props = {
  startsAt: string
  clinicName: string
  professionalName: string
  treatmentName: string
}

export function AvailableSlotCard({ startsAt, clinicName, professionalName, treatmentName }: Props) {
  const date = new Date(startsAt)
  const label = date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <article className="ac-slot-card">
      <h4>{label}</h4>
      <p>{clinicName}</p>
      <p>{professionalName}</p>
      <small>{treatmentName}</small>
    </article>
  )
}
