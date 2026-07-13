import { Menu, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import {
  PUBLIC_HEADER_CTA,
  PUBLIC_PRIMARY_NAV,
  hrefForNavItem,
  isHashOnlyHref,
  resolveHomeSectionHref,
  scrollToSection
} from '@/lib/public/routes'
import { LoginDropdown } from '../new-frontend/LoginDropdown'
import { DentalContainer } from './DentalContainer'

type Props = {
  onOpenDemo?: () => void
}

export const DentalHeader = ({ onOpenDemo }: Props) => {
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

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isHashOnlyHref(href)) {
      event.preventDefault()
      scrollToSection(href.slice(1))
      setOpen(false)
      return
    }
    if (href.startsWith('/#')) {
      const onHome = pathname === '/' || pathname === ''
      if (onHome) {
        event.preventDefault()
        scrollToSection(href.slice(2))
        setOpen(false)
      }
    }
  }

  const brandHref = resolveHomeSectionHref('inicio', pathname)
  const lookupHref = resolveHomeSectionHref(PUBLIC_HEADER_CTA.lookup.sectionId, pathname)

  return (
    <header className={`adb-header${scrolled ? ' is-scrolled' : ''}`}>
      <DentalContainer wide className="adb-header__inner">
        <a
          href={brandHref.startsWith('#') ? '/' : brandHref}
          className="adb-header__brand"
          onClick={(e) => (brandHref.startsWith('#') ? handleNavClick(e, brandHref) : undefined)}
        >
          <DentistaWebpLockup placement="header" context="public" showWordmark={false} />
          <span className="adb-header__brand-text">
            <strong>AgendaClinic</strong>
            <span>Gestión inteligente de citas</span>
          </span>
        </a>

        <nav className="adb-header__nav" aria-label="Navegación principal">
          {PUBLIC_PRIMARY_NAV.map((item) => {
            const href = hrefForNavItem(item, pathname)
            return (
              <a key={item.label} href={href} onClick={(e) => handleNavClick(e, href)}>
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="adb-header__actions">
          <a href={lookupHref} className="adb-header__link" onClick={(e) => handleNavClick(e, lookupHref)}>
            {PUBLIC_HEADER_CTA.lookup.label}
          </a>
          <LoginDropdown onNavigate={() => setOpen(false)} />
          <a href={PUBLIC_HEADER_CTA.book.href} className="adb-btn adb-btn--primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            {PUBLIC_HEADER_CTA.book.label}
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
            {PUBLIC_PRIMARY_NAV.map((item) => {
              const href = hrefForNavItem(item, pathname)
              return (
                <a
                  key={item.label}
                  href={href}
                  onClick={(e) => {
                    handleNavClick(e, href)
                    if (!isHashOnlyHref(href) && !href.startsWith('/#')) setOpen(false)
                  }}
                >
                  {item.label}
                </a>
              )
            })}
            <a href={lookupHref} onClick={(e) => handleNavClick(e, lookupHref)}>
              {PUBLIC_HEADER_CTA.lookup.label}
            </a>
            <a href="/portal-paciente" onClick={() => setOpen(false)}>
              Portal paciente
            </a>
            <a href="/login/admin" onClick={() => setOpen(false)}>
              Panel clínica
            </a>
            <div className="adb-header__mobile-cta">
              <a href={PUBLIC_HEADER_CTA.book.href} className="adb-btn adb-btn--primary">
                {PUBLIC_HEADER_CTA.book.label}
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
