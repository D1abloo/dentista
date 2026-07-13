import { Building2, ChevronDown, LogOut } from 'lucide-react'
import { Button } from '@/frontend/ds'

export const OrgSelector = () => (
  <button
    type="button"
    className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50 lg:flex"
    aria-label="Seleccionar organización"
  >
    <Building2 className="h-4 w-4 text-brand-600" aria-hidden />
    <span className="max-w-[8rem] truncate">AgendaClinic SaaS</span>
    <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
  </button>
)

export const UserMenu = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex items-center gap-2">
    <div className="hidden text-right sm:block">
      <p className="text-xs font-semibold text-slate-800">Super Admin</p>
      <p className="text-[11px] text-slate-500">Plataforma</p>
    </div>
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-600 text-xs font-bold text-white ring-2 ring-white">
      SA
    </span>
    <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Cerrar sesión">
      <LogOut className="h-4 w-4" aria-hidden />
    </Button>
  </div>
)
