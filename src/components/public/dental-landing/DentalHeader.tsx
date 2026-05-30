import { Menu, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { LoginDropdown } from '../new-frontend/LoginDropdown'
import { DentalContainer } from './DentalContainer'

const NAV = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#citas-online', label: 'Citas online' },
  { href: '#para-clinicas', label: 'Para clínicas' },
  { href: '/portal-paciente', label: 'Portal paciente' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#planes', label: 'Planes' },
  { href: '#ayuda', label: 'Ayuda' }
] as const

type Props = {
  onOpenDemo?: () => void
}

export const DentalHeader = ({ onOpenDemo }: Props) => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return
    event.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  return (
    <header className={`adb-header${scrolled ? ' is-scrolled' : ''}`}>
      <DentalContainer wide className="adb-header__inner">
        <a href="#inicio" className="adb-header__brand" onClick={(e) => handleLink(e, '#inicio')}>
          <DentistaWebpLockup placement="header" context="public" showWordmark={false} />
          <span className="adb-header__brand-text">
            <strong>AgendaClinic</strong>
            <span>Gestión inteligente de citas</span>
          </span>
        </a>

        <nav className="adb-header__nav" aria-label="Navegación principal">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => (item.href.startsWith('#') ? handleLink(e, item.href) : undefined)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="adb-header__actions">
          <a href="#consulta-cita" className="adb-header__link">
            Consultar cita
          </a>
          <LoginDropdown onNavigate={() => setOpen(false)} />
          <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            Reservar cita
          </a>
          <button
            type="button"
            className="adb-header__menu-btn"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </DentalContainer>

      {open ? (
        <div className="adb-header__mobile" role="dialog" aria-modal="true" aria-label="Menú móvil">
          <DentalContainer className="adb-header__mobile-inner">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => (item.href.startsWith('#') ? handleLink(e, item.href) : setOpen(false))}
              >
                {item.label}
              </a>
            ))}
            <a href="#consulta-cita">Consultar cita</a>
            <a href="/portal-paciente">Portal paciente</a>
            <a href="/login/admin">Panel clínica</a>
            <div className="adb-header__mobile-cta">
              <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
                Reservar cita
              </a>
              {onOpenDemo ? (
                <button type="button" className="adb-btn adb-btn--secondary" onClick={onOpenDemo}>
                  Solicitar demo
                </button>
              ) : null}
            </div>
          </DentalContainer>
        </div>
      ) : null}
    </header>
  )
}
