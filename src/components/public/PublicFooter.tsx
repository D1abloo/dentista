import { LogoMark } from '@/components/brand/Logo';

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="shell pub-footer__grid">
        <div>
          <a href="/" className="inline-flex items-center gap-2 text-white no-underline">
            <LogoMark size={32} />
            <span className="font-[family-name:var(--display)] text-lg">Dentista+</span>
          </a>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Plataforma premium para gestión de citas, informes, facturas y pagos dentales multi-clínica.
          </p>
        </div>
        <div>
          <h4>Servicios</h4>
          <a href="/#servicios">Citas online</a>
          <a href="/#portal">Portal paciente</a>
          <a href="/#admin">Panel clínica</a>
        </div>
        <div>
          <h4>Portales</h4>
          <a href="/login/paciente">Acceso paciente</a>
          <a href="/login/admin">Acceso administración</a>
          <a href="/reserva">Reserva pública</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="/cookies">Cookies</a>
          <a href="/privacidad">Privacidad</a>
          <a href="/terminos">Términos</a>
          <a href="/documentacion">Documentación</a>
          <a href="/contacto">Contacto</a>
        </div>
      </div>
      <div className="shell mt-10 border-t border-white/10 pt-6 text-center text-xs">
        © {new Date().getFullYear()} Dentista+. Modo demo con localStorage.
      </div>
    </footer>
  );
}
