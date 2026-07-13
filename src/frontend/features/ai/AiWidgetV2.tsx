import { useEffect, useState } from 'react'
import { Bot, X } from 'lucide-react'
import { AI_WIDGET_OPEN_EVENT, isAiWidgetHiddenPath } from '@/lib/public/aiWidget'
import { AiBookingExperience } from '@/frontend/features/ai/AiBookingExperience'
import { Button, Card } from '@/frontend/ds'

export const AiWidgetV2 = () => {
  const [open, setOpen] = useState(false)
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(AI_WIDGET_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(AI_WIDGET_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (isAiWidgetHiddenPath(pathname)) return null

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift transition hover:bg-brand-700"
        aria-label="Abrir asistente de citas"
        onClick={() => setOpen(true)}
      >
        <Bot className="h-6 w-6" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="presentation">
          <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <Card className="relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Asistente de citas</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AiBookingExperience />
          </Card>
        </div>
      ) : null}
    </>
  )
}
