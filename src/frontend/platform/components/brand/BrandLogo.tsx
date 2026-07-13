import { cn } from '@/frontend/lib/cn'

export const BrandMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    className={cn('h-9 w-9 shrink-0', className)}
    aria-hidden
    fill="none"
  >
    <defs>
      <linearGradient id="ac-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0891B2" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="10" fill="url(#ac-mark)" />
    <path
      d="M9 20c2.5-6 5-9 7-9s4.5 3 7 9"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="11" r="2.2" fill="white" />
  </svg>
)

export const BrandLogo = ({
  collapsed = false,
  className
}: {
  collapsed?: boolean
  className?: string
}) => (
  <div className={cn('flex items-center gap-3', className)}>
    <BrandMark />
    {!collapsed ? (
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold tracking-tight text-white">
          AgendaClinic
        </p>
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          SaaS
        </p>
      </div>
    ) : null}
  </div>
)
