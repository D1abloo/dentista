import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo: () => void
}

export function FinalCTA({ onOpenDemo }: Props) {
  return (
    <section className="ac-final-cta ac-final-cta--docfav" aria-labelledby="ac-final-cta-title">
      <ResponsiveContainer wide className="ac-final-cta__inner">
        <h2 id="ac-final-cta-title">Empieza hoy con tu clínica en orden. Comienza a crecer hoy.</h2>
        <p>Sin tarjeta · Sin permanencia · Soporte en español</p>
        <div className="ac-final-cta__actions">
          <button type="button" className="ac-btn ac-btn--secondary ac-btn--pill" onClick={onOpenDemo}>
            Empezar ahora gratis
          </button>
          <a href="/citas-con-ia" className="ac-btn ac-btn--ghost ac-btn--pill">
            Reservar con IA
          </a>
          <a href="/#planes" className="ac-btn ac-btn--ghost ac-btn--pill">
            Ver planes
          </a>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
