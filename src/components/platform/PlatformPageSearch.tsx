import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchPlatformNav } from '@/lib/platform/platformSearch';

export function PlatformPageSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchPlatformNav(query), [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        rootRef.current?.querySelector<HTMLInputElement>('input')?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery('');
    window.location.href = href;
  }

  return (
    <div className={`plt-page-search${className ? ` ${className}` : ''}`} ref={rootRef}>
      <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
      <input
        type="search"
        placeholder="Buscar en la plataforma…"
        aria-label="Buscar en la plataforma"
        aria-expanded={open}
        aria-controls="plt-page-search-results"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <kbd className="plt-page-search__kbd" aria-hidden>
        ⌘ K
      </kbd>
      {open && query.trim() ? (
        <ul id="plt-page-search-results" className="plt-page-search__results" role="listbox">
          {hits.length ? (
            hits.map((hit) => {
              const Icon = hit.icon;
              return (
                <li key={hit.href + hit.label} role="option">
                  <button type="button" onClick={() => go(hit.href)}>
                    <span className="plt-page-search__icon" aria-hidden>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <strong>{hit.label}</strong>
                      {hit.description ? <small>{hit.description}</small> : null}
                    </span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="plt-page-search__empty">Sin resultados para «{query}»</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
