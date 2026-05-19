import type { LucideIcon } from 'lucide-react';

const toneClass = {
  default: '',
  accent: 'kpi--teal',
  warn: 'kpi--coral',
  success: 'kpi--teal'
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof toneClass;
}) {
  return (
    <article className={`kpi ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="kpi__label">{label}</p>
          <p className="kpi__value">{value}</p>
          {hint ? <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--app-teal-soft)] text-[var(--app-teal)]" aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
