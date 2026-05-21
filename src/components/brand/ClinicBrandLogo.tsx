export function ClinicBrandLogo({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`clinic-brand-logo-shine ${className}`.trim()} style={{ width: size, height: size }}>
      <img
        src="/brand/clinic-shield.svg"
        alt="Dentista+"
        width={size}
        height={size}
        className="clinic-brand-logo-shine__img"
      />
    </span>
  );
}

export function ClinicBrandLockup({ size = 44, theme = 'light' }: { size?: number; theme?: 'light' | 'dark' }) {
  const main = theme === 'dark' ? 'text-white' : 'text-dental-950';
  const sub = theme === 'dark' ? 'text-white/70' : 'text-slate-600';
  return (
    <span className="clinic-brand-lockup inline-flex items-center gap-3">
      <ClinicBrandLogo size={size} />
      <span className="min-w-0 leading-tight">
        <span className={`block font-display text-lg tracking-tight ${main}`}>Dentista+</span>
        <span className={`block text-[10px] font-bold uppercase tracking-[0.16em] ${sub}`}>Tu clínica digital</span>
      </span>
    </span>
  );
}
