import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PatientFormValue, SlotOption } from './types'

type Props = {
  clinicName?: string
  treatmentName?: string
  slot: SlotOption | null
  patient: PatientFormValue
  onConfirm: () => void
  onEdit: () => void
  loading: boolean
}

export function BookingSummaryCard({ clinicName, treatmentName, slot, patient, onConfirm, onEdit, loading }: Props) {
  if (!slot) return null
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-900">Resumen de la cita</h3>
      <dl className="mt-3 grid gap-1 text-sm text-slate-700">
        <div><dt className="inline font-semibold">Clínica:</dt> <dd className="inline">{clinicName ?? 'Seleccionada'}</dd></div>
        <div><dt className="inline font-semibold">Tratamiento:</dt> <dd className="inline">{treatmentName ?? slot.treatmentName}</dd></div>
        <div><dt className="inline font-semibold">Profesional:</dt> <dd className="inline">{slot.professionalName}</dd></div>
        <div><dt className="inline font-semibold">Fecha:</dt> <dd className="inline">{format(parseISO(slot.startsAt), 'dd/MM/yyyy', { locale: es })}</dd></div>
        <div><dt className="inline font-semibold">Hora:</dt> <dd className="inline">{format(parseISO(slot.startsAt), 'HH:mm')}</dd></div>
        <div><dt className="inline font-semibold">Duración:</dt> <dd className="inline">{Math.max(15, (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000)} min</dd></div>
        <div><dt className="inline font-semibold">Paciente:</dt> <dd className="inline">{patient.fullName}</dd></div>
        <div><dt className="inline font-semibold">Email:</dt> <dd className="inline">{patient.email}</dd></div>
        <div><dt className="inline font-semibold">Teléfono:</dt> <dd className="inline">{patient.phone}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Reservando…' : 'Confirmar cita'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Cambiar datos
        </button>
      </div>
    </article>
  )
}
