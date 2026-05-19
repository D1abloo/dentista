import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel admin' },
  { href: '/#servicios', label: 'Servicios' },
  { href: '/documentacion', label: 'Documentación' },
  { href: '/contacto', label: 'Contacto' }
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pub-header">
      <div className="shell pub-header__inner">
        <a href="/" className="flex items-center gap-2 font-bold text-[var(--navy)] no-underline">
          <LogoMark size={36} />
          <span className="font-[family-name:var(--display)] text-lg">Dentista+</span>
        </a>
        <nav className="pub-nav" aria-label="Principal">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pub-actions">
          <a href="/login" className="btn btn--ghost btn--sm hidden sm:inline-flex">
            Iniciar sesión
          </a>
          <a href="/reserva" className="btn btn--primary btn--sm">
            Reservar cita
          </a>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="pub-drawer lg:hidden" aria-label="Menú móvil">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/login" className="mt-2" onClick={() => setOpen(false)}>
            Iniciar sesión
          </a>
        </nav>
      ) : null}
    </header>
  );
}
