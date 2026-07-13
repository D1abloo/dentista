import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'

export const GlobalSearch = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setQuery('')
  }

  return (
    <label
      className={cn(
        'relative hidden min-w-0 flex-1 items-center md:flex md:max-w-md',
        className
      )}
    >
      <span className="sr-only">Búsqueda global</span>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar clínicas, usuarios, incidencias…"
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
      />
    </label>
  )
}
