import type { CSSProperties, KeyboardEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LANDING_TESTIMONIALS, TRUST_CLINICS } from '@/lib/public/trustClinics'
import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo: () => void
}

const AUTO_MS = 7000

const clinicAccent = (name: string) => TRUST_CLINICS.find((c) => c.name === name)?.accent ?? '#0d9488'

export function TestimonialsSection({ onOpenDemo }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = LANDING_TESTIMONIALS.length
  const item = LANDING_TESTIMONIALS[index]

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % total) + total) % total)
    },
    [total]
  )

  const handlePrev = () => goTo(index - 1)
  const handleNext = () => goTo(index + 1)

  useEffect(() => {
    if (paused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const timer = window.setInterval(() => goTo(index + 1), AUTO_MS)
    return () => window.clearInterval(timer)
  }, [index, paused, goTo])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') handlePrev()
    if (event.key === 'ArrowRight') handleNext()
  }

  return (
    <section className="ac-section ac-section--testimonials" aria-labelledby="ac-testimonials-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-testimonials-title">Casos de éxito</h2>
          <p>Clínicas que ya digitalizaron citas, historial y facturación con AgendaClinic.</p>
        </header>

        <div
          className="ac-testimonials-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            className="ac-testimonials-carousel__nav ac-testimonials-carousel__nav--prev"
            aria-label="Testimonio anterior"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <div className="ac-testimonials-carousel__viewport" aria-live="polite" aria-atomic="true">
            <blockquote key={item.author} className="ac-testimonial ac-testimonial--featured">
              <p>“{item.quote}”</p>
              <footer>
                <span
                  className="ac-testimonial__avatar"
                  style={{ '--clinic-accent': clinicAccent(item.clinicKey) } as CSSProperties}
                  aria-hidden
                >
                  {TRUST_CLINICS.find((c) => c.name === item.clinicKey)?.initials ?? 'AC'}
                </span>
                <span className="ac-testimonial__meta">
                  <strong>{item.author}</strong>
                  <small>{item.role}</small>
                </span>
              </footer>
            </blockquote>
          </div>

          <button
            type="button"
            className="ac-testimonials-carousel__nav ac-testimonials-carousel__nav--next"
            aria-label="Testimonio siguiente"
            onClick={handleNext}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="ac-testimonials-carousel__dots" role="tablist" aria-label="Seleccionar testimonio">
          {LANDING_TESTIMONIALS.map((t, i) => (
            <button
              key={t.author}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Testimonio ${i + 1}: ${t.author}`}
              className={`ac-testimonials-carousel__dot${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div className="ac-section__cta-row">
          <button type="button" className="ac-btn ac-btn--primary ac-btn--pill" onClick={onOpenDemo}>
            Pruébalo gratis
          </button>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
