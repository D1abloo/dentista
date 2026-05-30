import { useState } from 'react'
import type { PublicPatientAppointment } from '@/lib/services/patientAppointmentsPublic'
import { DentalContainer } from './DentalContainer'

type LookupResult = {
  appointments: PublicPatientAppointment[]
  message: string
  matchCount: number
}

export const PublicLookupSection = () => {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LookupResult | null>(null)

  const handleSubmit = async () => {
    const value = identifier.trim()
    if (!value) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/public-appointments/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: value })
      })
      const json = (await response.json()) as {
        data?: LookupResult
        error?: { message?: string } | string
      }
      if (!response.ok) {
        const msg = typeof json.error === 'string' ? json.error : json.error?.message
        throw new Error(msg ?? 'No se pudo consultar la cita.')
      }
      setResult(json.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar la cita.')
    } finally {
      setLoading(false)
    }
  }

  const appointment = result?.appointments?.[0]

  return (
    <section id="consulta-cita" className="adb-section adb-section--lookup" aria-labelledby="adb-lookup-title">
      <DentalContainer wide>
        <div className="adb-lookup">
          <div className="adb-lookup__form-col">
            <header className="adb-section-head">
              <p className="adb-kicker">Consulta pública</p>
              <h2 id="adb-lookup-title">Consulta rápida de citas</h2>
              <p>Comprueba si tienes una cita próxima usando un solo dato.</p>
            </header>
            <label htmlFor="adb-lookup-input" className="adb-field">
              <span>Email, DNI o NHC</span>
              <input
                id="adb-lookup-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Introduce tu email, DNI o NHC"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="adb-btn adb-btn--primary"
              onClick={handleSubmit}
              disabled={loading || !identifier.trim()}
            >
              {loading ? 'Buscando cita…' : 'Buscar cita'}
            </button>
            <p className="adb-lookup__helper">
              Con email, DNI o NHC podemos mostrarte información básica de tu próxima cita. Para ver detalles privados,
              inicia sesión en el Portal del Paciente.
            </p>
            {error ? (
              <p className="adb-alert adb-alert--error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="adb-lookup__result" aria-live="polite">
            {appointment ? (
              <article className="adb-appt-result">
                <h3>Cita encontrada</h3>
                <dl>
                  <div>
                    <dt>Fecha</dt>
                    <dd>
                      {new Date(appointment.startsAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Hora</dt>
                    <dd>
                      {new Date(appointment.startsAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{appointment.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Dirección</dt>
                    <dd>{appointment.clinicAddress ?? 'Consultar en portal'}</dd>
                  </div>
                  <div>
                    <dt>Tratamiento</dt>
                    <dd>{appointment.treatmentName}</dd>
                  </div>
                  <div>
                    <dt>Profesional</dt>
                    <dd>{appointment.professionalName}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{appointment.statusLabel ?? appointment.status}</dd>
                  </div>
                </dl>
                <div className="adb-appt-result__actions">
                  <a href="/portal-paciente" className="adb-btn adb-btn--secondary">
                    Ver en Portal del Paciente
                  </a>
                  <a href="/citas-con-ia" className="adb-btn adb-btn--ghost">
                    Cambiar cita
                  </a>
                  <a href="/citas-con-ia" className="adb-btn adb-btn--ghost">
                    Cancelar cita
                  </a>
                  <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
                    Reservar otra cita
                  </a>
                </div>
              </article>
            ) : result && !appointment ? (
              <article className="adb-appt-result adb-appt-result--empty">
                <h3>No hemos encontrado citas próximas</h3>
                <p>
                  {result.message ||
                    'No hay citas asociadas a esos datos. Puedes reservar una nueva cita o contactar con la clínica.'}
                </p>
                <div className="adb-appt-result__actions">
                  <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
                    Reservar nueva cita
                  </a>
                  <a href="/contacto" className="adb-btn adb-btn--secondary">
                    Contactar clínica
                  </a>
                </div>
              </article>
            ) : (
              <div className="adb-lookup__placeholder">
                <p>Introduce tu email, DNI o NHC para ver el resultado aquí.</p>
              </div>
            )}
          </div>
        </div>
      </DentalContainer>
    </section>
  )
}
