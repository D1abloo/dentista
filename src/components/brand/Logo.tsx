export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/dentista-logo.svg"
      alt=""
      width={size}
      height={size}
      className={`rounded-2xl shadow-lg shadow-dental-200/70 ${className}`}
    />
  );
}

export function LogoWordmark({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const main = theme === 'dark' ? 'text-white' : 'text-dental-950';
  const sub = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  return (
    <span className="min-w-0 leading-tight">
      <span className={`block font-display text-xl tracking-tight ${main}`}>Dentista+</span>
      <span className={`block text-[11px] font-bold uppercase tracking-[0.14em] ${sub}`}>Citas dentales</span>
    </span>
  );
}

export function Logo({ theme = 'light', size = 44 }: { theme?: 'light' | 'dark'; size?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={size} />
      <LogoWordmark theme={theme} />
    </span>
  );
}
