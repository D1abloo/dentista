import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { runAdminSearch, scopePatientIdsForTenant } from '@/lib/adminSearch';
import { IdBadge } from '@/components/ui/IdBadge';

export function AdminSearch({ className = '' }: { className?: string }) {
  const { state } = useDemoStore();
  const scope = useTenant();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const hits = useMemo(() => {
    const scopePatientIds = scopePatientIdsForTenant(state, scope.tenantId);
    return runAdminSearch(state, {
      q,
      kind: 'all',
      tenantId: scope.tenantId,
      scopePatientIds,
      appointments: scope.appointments,
      invoices: scope.invoices,
      invoiceIds: new Set(scope.invoices.map((i) => i.id))
    });
  }, [state, scope, q]);

  const showResults = open && q.trim().length >= 2;
  const showEmpty = open && q.trim().length >= 2 && !hits.length;

  return (
    <div
      className={`admin-search ${className}`.trim()}
      role="search"
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Search className="admin-search__icon" aria-hidden />
      <input
        type="search"
        className="admin-search__input"
        placeholder="NHC, DNI, nombre, factura FAC…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar pacientes, citas y facturas"
        autoComplete="off"
      />

      {showResults ? (
        <ul className="admin-search__drop" role="listbox">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`} role="option">
              <a href={h.href} className="admin-search__hit" onClick={() => setQ('')}>
                <IdBadge id={h.id} kind={h.kind} />
                <span className="admin-search__hit-text">
                  <span className="admin-search__hit-label">{h.label}</span>
                  {h.meta ? <span className="admin-search__hit-meta">{h.meta}</span> : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? <p className="admin-search__empty">Sin resultados para esta búsqueda.</p> : null}
    </div>
  );
}
