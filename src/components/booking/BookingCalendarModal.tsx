import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'
import { Alert, Button, Input, Spinner } from '@/frontend/ds'
import type {
  BookingCalendarModalProps,
  BookingCatalogClinic,
  BookingCatalogProfessional,
  BookingCatalogTreatment,
  PublicBookingSlot
} from '@/lib/booking/types'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

const todayIso = () => format(new Date(), 'yyyy-MM-dd')

export const BookingCalendarModal = ({
  isOpen,
  onClose,
  clinicId: initialClinicId,
  patientContext,
  source: _source
}: BookingCalendarModalProps) => {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clinics, setClinics] = useState<BookingCatalogClinic[]>([])
  const [treatments, setTreatments] = useState<BookingCatalogTreatment[]>([])
  const [professionals, setProfessionals] = useState<BookingCatalogProfessional[]>([])
  const [clinicId, setClinicId] = useState('')
  const [treatmentId, setTreatmentId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [slots, setSlots] = useState<PublicBookingSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<PublicBookingSlot | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [success, setSuccess] = useState(false)
  const [patient, setPatient] = useState({
    fullName: patientContext?.fullName ?? '',
    email: patientContext?.email ?? '',
    phone: patientContext?.phone ?? '',
    dni: patientContext?.dni ?? ''
  })

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = initialClinicId ? `?clinicId=${encodeURIComponent(initialClinicId)}` : ''
      const res = await fetch(`/api/public/ai-booking${query}`, { credentials: 'include' })
      const json = (await res.json()) as {
        data?: {
          clinics?: BookingCatalogClinic[]
          treatments?: BookingCatalogTreatment[]
          professionals?: BookingCatalogProfessional[]
          available?: boolean
        }
        error?: { message?: string }
      }
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cargar el calendario.')
      const list = json.data?.clinics ?? []
      setClinics(list)
      setTreatments(json.data?.treatments ?? [])
      setProfessionals(json.data?.professionals ?? [])
      const nextClinic = initialClinicId ?? list[0]?.id ?? ''
      setClinicId(nextClinic)
      if (nextClinic && !json.data?.treatments?.length) {
        const r2 = await fetch(`/api/public/ai-booking?clinicId=${encodeURIComponent(nextClinic)}`)
        const j2 = (await r2.json()) as { data?: { treatments?: BookingCatalogTreatment[]; professionals?: BookingCatalogProfessional[] } }
        setTreatments(j2.data?.treatments ?? [])
        setProfessionals(j2.data?.professionals ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos.')
    } finally {
      setLoading(false)
    }
  }, [initialClinicId])

  useEffect(() => {
    if (!isOpen) return
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSuccess(false)
    setSelectedSlot(null)
    setSelectedDate(todayIso())
    void loadCatalog()
    void fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return
        const json = (await res.json()) as { data?: { name?: string; email?: string; phone?: string } }
        if (json.data?.name) setPatient((p) => ({ ...p, fullName: p.fullName || json.data!.name! }))
        if (json.data?.email) setPatient((p) => ({ ...p, email: p.email || json.data!.email! }))
        if (json.data?.phone) setPatient((p) => ({ ...p, phone: p.phone || json.data!.phone! }))
      })
      .catch(() => undefined)
  }, [isOpen, loadCatalog])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !clinicId || !treatmentId || !selectedDate) return
    let cancelled = false
    setSlotsLoading(true)
    setError(null)
    void fetch('/api/public-booking/available-slots', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        clinicId,
        treatmentId,
        professionalId: professionalId || undefined,
        fromDate: selectedDate,
        toDate: selectedDate,
        preferredTime: 'any'
      })
    })
      .then(async (res) => {
        const json = (await res.json()) as { data?: { slots?: PublicBookingSlot[] }; error?: { message?: string } }
        if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo consultar disponibilidad.')
        if (!cancelled) {
          setSlots(json.data?.slots ?? [])
          setSelectedSlot(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error de disponibilidad.')
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, clinicId, treatmentId, professionalId, selectedDate])

  const clinic = clinics.find((c) => c.id === clinicId)
  const monthDays = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    return eachDayOfInterval({ start, end })
  }, [month])

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedSlot.professionalId) return
    setConfirming(true)
    setError(null)
    try {
      const res = await fetch('/api/public-booking/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clinicId: selectedSlot.clinicId,
          treatmentId: selectedSlot.treatmentId,
          professionalId: selectedSlot.professionalId,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          hasPortalAccount: true,
          patient
        })
      })
      const json = (await res.json()) as { error?: { message?: string } }
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo confirmar la cita.')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar.')
    } finally {
      setConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[var(--pf-z-modal,60)] flex items-end justify-center sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] motion-safe:animate-fade-in" aria-label="Cerrar" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex w-full max-w-3xl flex-col bg-white shadow-2xl motion-safe:animate-fade-up',
          'max-h-[100dvh] sm:max-h-[min(92dvh,860px)] sm:rounded-2xl sm:border sm:border-slate-200',
          'pb-[env(safe-area-inset-bottom)]'
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
              Reserva tu cita
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {clinic?.name ?? 'Selecciona clínica y tratamiento'}
              {clinic?.address ? ` · ${clinic.address}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Cerrar calendario" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {loading ? (
            <Spinner label="Cargando calendario…" />
          ) : success ? (
            <Alert tone="success" title="Cita solicitada">
              Tu reserva se ha registrado correctamente. Recibirás confirmación por la clínica.
            </Alert>
          ) : (
            <div className="space-y-5">
              {error ? <Alert tone="danger">{error}</Alert> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">Clínica</span>
                  <select
                    className="h-11 rounded-xl border border-slate-200 px-3"
                    value={clinicId}
                    onChange={(e) => {
                      setClinicId(e.target.value)
                      setTreatmentId('')
                      setProfessionalId('')
                    }}
                  >
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">Tratamiento</span>
                  <select
                    className="h-11 rounded-xl border border-slate-200 px-3"
                    value={treatmentId}
                    onChange={(e) => setTreatmentId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {treatments.filter((t) => t.clinicId === clinicId).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2">
                  <span className="font-medium text-slate-700">Profesional (opcional)</span>
                  <select
                    className="h-11 rounded-xl border border-slate-200 px-3"
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                  >
                    <option value="">Cualquiera disponible</option>
                    {professionals.filter((p) => p.clinicId === clinicId).map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </label>
              </div>

              {treatmentId ? (
                <>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold capitalize text-ink">
                        {format(month, 'MMMM yyyy', { locale: es })}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" aria-label="Mes anterior" onClick={() => setMonth((m) => subMonths(m, 1))}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Mes siguiente" onClick={() => setMonth((m) => addMonths(m, 1))}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((day) => {
                        const iso = format(day, 'yyyy-MM-dd')
                        const selected = iso === selectedDate
                        const disabled = iso < todayIso()
                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedDate(iso)}
                            className={cn(
                              'h-10 rounded-lg text-sm font-medium transition-colors',
                              !isSameMonth(day, month) && 'text-slate-300',
                              selected && 'bg-brand-600 text-white',
                              !selected && !disabled && 'hover:bg-brand-50 text-slate-800',
                              disabled && 'cursor-not-allowed opacity-40',
                              isToday(day) && !selected && 'ring-1 ring-brand-300'
                            )}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-ink">
                      Horarios · {format(parseISO(`${selectedDate}T12:00:00`), 'd MMM yyyy', { locale: es })}
                    </p>
                    {slotsLoading ? (
                      <Spinner label="Consultando huecos…" className="py-6" />
                    ) : slots.length ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {slots.map((slot) => (
                          <button
                            key={`${slot.startsAt}-${slot.professionalId}`}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                              selectedSlot?.startsAt === slot.startsAt
                                ? 'border-brand-500 bg-brand-50'
                                : 'border-slate-200 hover:border-brand-300'
                            )}
                          >
                            <span className="font-semibold">{slot.label || format(parseISO(slot.startsAt), 'HH:mm')}</span>
                            <span className="block text-xs text-slate-500">{slot.professionalName}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No hay huecos disponibles este día.</p>
                    )}
                  </div>

                  {selectedSlot ? (
                    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                      <Input label="Nombre" value={patient.fullName} onChange={(e) => setPatient((p) => ({ ...p, fullName: e.target.value }))} required />
                      <Input label="Email" type="email" value={patient.email} onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))} required />
                      <Input label="Teléfono" value={patient.phone} onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))} required />
                      <Input label="DNI (opcional)" value={patient.dni} onChange={(e) => setPatient((p) => ({ ...p, dni: e.target.value }))} />
                      <div className="sm:col-span-2">
                        <Button className="w-full" loading={confirming} onClick={() => void handleConfirm()}>
                          Confirmar reserva
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ReserveAppointmentButton = ({
  onClick,
  loading = false,
  disabled = false,
  className,
  label = 'Reservar cita'
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
  label?: string
}) => (
  <Button
    type="button"
    size="lg"
    loading={loading}
    disabled={disabled}
    leftIcon={!loading ? <CalendarPlus className="h-5 w-5" aria-hidden /> : undefined}
    className={cn('min-h-11 shadow-md shadow-brand-900/10 motion-safe:active:scale-[0.98]', className)}
    onClick={onClick}
  >
    {label}
  </Button>
)
