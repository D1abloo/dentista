import {
  Gauge,
  Hand,
  Menu,
  ShieldCheck,
  Smartphone,
  Target,
  UserRound
} from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { MobilePhoneShell } from './landingMobile/MobilePhoneShell';
import {
  PhoneMockCompactNav,
  PhoneMockFullMenu,
  PhoneMockProfileAccess
} from './landingMobile/MobileShowcasePhones';

const CARDS = [
  {
    title: 'Navegación compacta',
    subtitle: 'Logo, acceso rápido y menú siempre visibles.',
    Icon: Smartphone,
    Phone: PhoneMockCompactNav,
    alt: 'Vista móvil del header de Dentista+'
  },
  {
    title: 'Menú completo',
    subtitle: 'Todas las secciones ordenadas para pantallas pequeñas.',
    Icon: Menu,
    Phone: PhoneMockFullMenu,
    alt: 'Menú móvil abierto de Dentista+'
  },
  {
    title: 'Accesos por perfil',
    subtitle: 'Paciente, clínica y plataforma separados para evitar confusión.',
    Icon: UserRound,
    Phone: PhoneMockProfileAccess,
    alt: 'Dropdown móvil de acceso por perfil en Dentista+'
  }
] as const;

const BENEFITS = [
  { label: 'Carga rápida', Icon: Gauge },
  { label: 'Botones grandes', Icon: Hand },
  { label: 'Acceso claro', Icon: Target },
  { label: 'Diseño responsive', Icon: Smartphone },
  { label: 'Sin mezclar portales', Icon: ShieldCheck }
] as const;

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

export function LandingMobileShowcase() {
  const sectionR = useReveal();

  return (
    <section
      id="movil"
      className="ps-mob-ex"
      aria-labelledby="ps-mob-ex-title"
    >
      <div className="ps-mob-ex__deco ps-mob-ex__deco--circle" aria-hidden />
      <div className="ps-mob-ex__deco ps-mob-ex__deco--dots" aria-hidden />
      <div className="ps-mob-ex__deco ps-mob-ex__deco--plus" aria-hidden>
        +
      </div>

      <div
        className={`ps-shell ps-shell--wide ps-mob-ex__inner ps-reveal${revealClass(sectionR.visible)}`}
        ref={sectionR.ref}
      >
        <header className="ps-mob-ex__head ps-mob-ex__anim ps-mob-ex__anim--1">
          <h2 id="ps-mob-ex-title">
            Dentista+ en móvil, <span className="ps-mob-ex__hl">rápido y claro</span>
          </h2>
          <p className="ps-mob-ex__lead">
            Pacientes, clínicas y administradores pueden acceder al portal correcto desde cualquier pantalla.
          </p>
          <p className="ps-mob-ex__seo-note">
            Software dental responsive con portal paciente móvil, agenda dental online y acceso móvil para
            clínicas dentales: gestión dental desde el móvil sin mezclar portales.
          </p>
        </header>

        <div className="ps-mob-ex__grid">
          {CARDS.map((card, index) => {
            const CardIcon = card.Icon;
            const PhoneContent = card.Phone;
            return (
              <article
                key={card.title}
                className={`ps-mob-ex__card ps-mob-ex__anim ps-mob-ex__anim--${index + 2}`}
              >
                <div className="ps-mob-ex__card-meta">
                  <span className="ps-mob-ex__card-icon" aria-hidden>
                    <CardIcon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                </div>
                <MobilePhoneShell alt={card.alt} className="ps-mob-ex__phone">
                  <PhoneContent />
                </MobilePhoneShell>
              </article>
            );
          })}
        </div>

        <ul className="ps-mob-ex__benefits ps-mob-ex__anim ps-mob-ex__anim--5" aria-label="Ventajas móviles">
          {BENEFITS.map((b, i) => {
            const BIcon = b.Icon;
            return (
              <li
                key={b.label}
                className="ps-mob-ex__benefit"
                style={{ animationDelay: `${0.06 * i + 0.45}s` }}
              >
                <span className="ps-mob-ex__benefit-icon" aria-hidden>
                  <BIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                {b.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
