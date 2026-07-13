import { Menu, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { openAiAppointmentsWidget } from '@/lib/public/aiWidget'
import {
  PUBLIC_HEADER_CTA,
  PUBLIC_PRIMARY_NAV,
  hrefForNavItem,
  scrollToSection
} from '@/lib/public/routes'
import { LoginDropdown } from './LoginDropdown'
import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo?: () => void
}

export function AppHeader({ onOpenDemo }: Props) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pathname, setPathname] = useState('/')

  useEffect(() => {
    setPathname(window.location.pathname)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isHome = pathname === '/' || pathname === ''

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string, sectionId?: string) => {
    if (sectionId === 'citas-online') {
      event.preventDefault()
      openAiAppointmentsWidget()
      setOpen(false)
      return
    }
    if (!sectionId || !isHome) return
    if (!href.startsWith('#')) return
    event.preventDefault()
    scrollToSection(sectionId)
    setOpen(false)
  }

  const handleBookClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    openAiAppointmentsWidget()
    setOpen(false)
  }

  const handleLookupClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    openAiAppointmentsWidget()
    setOpen(false)
  }

  return (
    <header className={`ac-header ac-header--docfav${scrolled ? ' is-scrolled' : ''}`}>
      <ResponsiveContainer wide className="ac-header__inner">
        <a href="/" className="ac-header__brand">
          <DentistaWebpLockup placement="header" context="public" showWordmark={false} />
          <span className="ac-header__brand-text">
            <strong>AgendaClinic</strong>
            <span>Gestión inteligente de citas</span>
          </span>
        </a>

        <nav className="ac-header__nav" aria-label="Navegación principal">
          {PUBLIC_PRIMARY_NAV.map((item) => {
            const href = hrefForNavItem(item, pathname)
            const sectionId = item.type === 'hash' ? item.sectionId : undefined
            return (
              <a
                key={item.label}
                href={href}
                onClick={(e) => handleNavClick(e, href, sectionId)}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="ac-header__actions">
          <button type="button" className="ac-header__link" onClick={handleLookupClick}>
            {PUBLIC_HEADER_CTA.lookup.label}
          </button>
          <LoginDropdown onNavigate={() => setOpen(false)} />
          <button type="button" className="ac-btn ac-btn--primary" onClick={handleBookClick}>
            {PUBLIC_HEADER_CTA.book.label}
          </button>
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
            {PUBLIC_PRIMARY_NAV.map((item) => {
              const href = hrefForNavItem(item, pathname)
              const sectionId = item.type === 'hash' ? item.sectionId : undefined
              return (
                <a key={item.label} href={href} onClick={(e) => handleNavClick(e, href, sectionId)}>
                  {item.label}
                </a>
              )
            })}
            <button type="button" onClick={handleLookupClick}>
              {PUBLIC_HEADER_CTA.lookup.label}
            </button>
            <a href="/login/admin">Panel clínica</a>
            <a href="/platform/login">Plataforma</a>
            <div className="ac-header__mobile-cta">
              <button type="button" className="ac-btn ac-btn--primary" onClick={handleBookClick}>
                {PUBLIC_HEADER_CTA.book.label}
              </button>
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
