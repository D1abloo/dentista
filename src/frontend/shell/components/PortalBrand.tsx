import { cn } from '@/frontend/lib/cn'
import { BrandMark } from '@/frontend/platform/components/brand/BrandLogo'

export const PortalBrand = ({
  brand,
  subtitle,
  collapsed = false,
  className
}: {
  brand: string
  subtitle?: string
  collapsed?: boolean
  className?: string
}) => (
  <div className={cn('flex items-center gap-3', className)}>
    <BrandMark className={collapsed ? 'h-9 w-9' : undefined} />
    {!collapsed ? (
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold tracking-tight text-white">{brand}</p>
        {subtitle ? (
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-cyan-300/70">
            {subtitle}
          </p>
        ) : null}
      </div>
    ) : null}
  </div>
)
