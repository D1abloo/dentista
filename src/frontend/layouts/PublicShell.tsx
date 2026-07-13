import { useEffect, useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'
import { Button } from '@/frontend/ds'
import {
  PUBLIC_FOOTER_COLUMNS,
  PUBLIC_HEADER_CTA,
  PUBLIC_PRIMARY_NAV,
  hrefForNavItem,
  resolveHomeSectionHref,
  scrollToSection
} from '@/lib/public/routes'
import { BRAND_NAME } from '@/lib/brand/identity'

type Props = {
  children: ReactNode
  onOpenDemo?: () => void
}

export const PublicShell = ({ children, onOpenDemo }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pathname, setPathname] = useState('/')

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const handleNav = (href: string) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      scrollToSection(href.slice(1))
      return
    }
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      if (pathname === '/') scrollToSection(id)
      else window.location.href = href
    }
  }

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <a href="#main-content" className="nx-skip">
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white"
              aria-hidden
            >
              AC
            </span>
            {BRAND_NAME}
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {PUBLIC_PRIMARY_NAV.map((item) => {
              const href = hrefForNavItem(item, pathname)
              const isHash = href.startsWith('#') || href.startsWith('/#')
              return isHash ? (
                <button
                  key={item.label}
                  type="button"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => handleNav(href)}
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNav(resolveHomeSectionHref(PUBLIC_HEADER_CTA.lookup.sectionId, pathname))}
            >
              {PUBLIC_HEADER_CTA.lookup.label}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (onOpenDemo) onOpenDemo()
                else handleNav(PUBLIC_HEADER_CTA.book.href)
              }}
            >
              {PUBLIC_HEADER_CTA.book.label}
            </Button>
            <a
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Acceder
            </a>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menú</span>
          </Button>
        </div>

        <nav
          id="mobile-nav"
          className={cn(
            'border-t border-slate-200 bg-white lg:hidden',
            menuOpen ? 'block' : 'hidden'
          )}
          aria-label="Móvil"
        >
          <ul className="space-y-1 px-4 py-3">
            {PUBLIC_PRIMARY_NAV.map((item) => {
              const href = hrefForNavItem(item, pathname)
              const isHash = href.startsWith('#') || href.startsWith('/#')
              return (
                <li key={item.label}>
                  {isHash ? (
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => handleNav(href)}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <a
                      href={href}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              )
            })}
            <li className="pt-2">
              <Button className="w-full" size="sm" onClick={() => handleNav(PUBLIC_HEADER_CTA.book.href)}>
                {PUBLIC_HEADER_CTA.book.label}
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 sm:px-6 lg:px-8">
          {PUBLIC_FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-slate-900">{col.title}</h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-600 hover:text-brand-700">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {BRAND_NAME}. Software clínico con agenda, facturación y portal paciente.
        </div>
      </footer>
    </div>
  )
}
