import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { BookingPatientContext, BookingSource } from '@/lib/booking/types'
import { BookingCalendarModal } from './BookingCalendarModal'

type OpenArgs = {
  clinicId?: string | null
  patientContext?: BookingPatientContext
  source: BookingSource
}

type BookingCalendarContextValue = {
  isOpen: boolean
  openCalendar: (args: OpenArgs) => void
  closeCalendar: () => void
}

const BookingCalendarContext = createContext<BookingCalendarContextValue | null>(null)

export const BookingCalendarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [patientContext, setPatientContext] = useState<BookingPatientContext | undefined>()
  const [source, setSource] = useState<BookingSource>('patient_portal')

  const openCalendar = useCallback(({ clinicId: nextClinicId, patientContext: ctx, source: nextSource }: OpenArgs) => {
    setClinicId(nextClinicId ?? null)
    setPatientContext(ctx)
    setSource(nextSource)
    setIsOpen(true)
  }, [])

  const closeCalendar = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openCalendar, closeCalendar }),
    [isOpen, openCalendar, closeCalendar]
  )

  return (
    <BookingCalendarContext.Provider value={value}>
      {children}
      <BookingCalendarModal
        isOpen={isOpen}
        onClose={closeCalendar}
        clinicId={clinicId}
        patientContext={patientContext}
        source={source}
      />
    </BookingCalendarContext.Provider>
  )
}

export const useBookingCalendar = () => {
  const ctx = useContext(BookingCalendarContext)
  if (!ctx) {
    return { isOpen: false, openCalendar: () => undefined, closeCalendar: () => undefined }
  }
  return ctx
}
