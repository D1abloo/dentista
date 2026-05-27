import { Menu, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { LoginDropdown } from './LoginDropdown'
import { ResponsiveContainer } from './ResponsiveContainer'

const NAV = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#funciones', label: 'Funciones' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#citas-ia', label: 'Citas con IA' },
  { href: '#planes', label: 'Planes' },
  { href: '#ayuda', label: 'Ayuda' }
] as const

type Props = {
  onOpenDemo?: () => void
}

export function AppHeader({ onOpenDemo }: Props) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleHashLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return
    event.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  return (
    <header className={`ac-header${scrolled ? ' is-scrolled' : ''}`}>
      <ResponsiveContainer wide className="ac-header__inner">
        <a href="#inicio" className="ac-header__brand" onClick={(e) => handleHashLink(e, '#inicio')}>
          <DentistaWebpLockup placement="header" context="public" showWordmark={false} />
          <span className="ac-header__brand-text">
            <strong>AgendaClinic</strong>
            <span>Gestión inteligente de citas</span>
          </span>
        </a>

        <nav className="ac-header__nav" aria-label="Navegación principal">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => handleHashLink(e, item.href)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ac-header__actions">
          <a href="/portal-paciente" className="ac-header__link">
            Portal paciente
          </a>
          <LoginDropdown onNavigate={() => setOpen(false)} />
          <a href="/citas-con-ia" className="ac-btn ac-btn--primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            Reservar con IA
          </a>
          <button
            type="button"
            className="ac-header__menu-btn"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </ResponsiveContainer>

      {open ? (
        <div className="ac-header__mobile" role="dialog" aria-modal="true" aria-label="Menú móvil">
          <ResponsiveContainer className="ac-header__mobile-inner">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={(e) => handleHashLink(e, item.href)}>
                {item.label}
              </a>
            ))}
            <a href="/portal-paciente">Portal paciente</a>
            <a href="/login/admin">Panel clínica</a>
            <a href="/platform/login">Plataforma</a>
            <div className="ac-header__mobile-cta">
              <a href="/citas-con-ia" className="ac-btn ac-btn--primary">
                Reservar con IA
              </a>
              {onOpenDemo ? (
                <button type="button" className="ac-btn ac-btn--secondary" onClick={onOpenDemo}>
                  Solicitar demo
                </button>
              ) : null}
            </div>
          </ResponsiveContainer>
        </div>
      ) : null}
    </header>
  )
}
