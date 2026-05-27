import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo: () => void
}

export function FinalCTA({ onOpenDemo }: Props) {
  return (
    <section className="ac-final-cta" aria-labelledby="ac-final-cta-title">
      <ResponsiveContainer wide className="ac-final-cta__inner">
        <h2 id="ac-final-cta-title">Empieza a gestionar tus citas con AgendaClinic</h2>
        <p>Reserva online, agenda clínica, portal paciente y facturación en una sola plataforma.</p>
        <div className="ac-final-cta__actions">
          <a href="/citas-con-ia" className="ac-btn ac-btn--secondary">
            Reservar con IA
          </a>
          <button type="button" className="ac-btn ac-btn--ghost" onClick={onOpenDemo}>
            Solicitar demo
          </button>
          <a href="#planes" className="ac-btn ac-btn--ghost">
            Ver planes
          </a>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
