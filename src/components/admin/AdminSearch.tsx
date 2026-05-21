import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { runAdminSearch, scopePatientIdsForTenant, type AdminSearchKind } from '@/lib/adminSearch';
import { IdBadge } from '@/components/ui/IdBadge';
import { Input } from '@/components/ui';

const KIND_OPTIONS: { id: AdminSearchKind; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'facturas', label: 'Facturas' },
  { id: 'citas', label: 'Citas' },
  { id: 'informes', label: 'Informes' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'pagos', label: 'Pagos' }
];

export function AdminSearch() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<AdminSearchKind>('all');

  const hits = useMemo(() => {
    const scopePatientIds = scopePatientIdsForTenant(state, scope.tenantId);
    return runAdminSearch(state, {
      q,
      kind,
      tenantId: scope.tenantId,
      scopePatientIds,
      appointments: scope.appointments,
      invoices: scope.invoices,
      invoiceIds: new Set(scope.invoices.map((i) => i.id))
    });
  }, [state, scope, q, kind]);

  return (
    <div className="admin-search">
      <Search className="admin-search__icon" aria-hidden />
      <Input
        className="admin-search__input"
        placeholder="NHC, DNI, nombre, factura FAC-…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Búsqueda administrativa"
      />
      <select
        className="admin-search__filter field-control"
        value={kind}
        onChange={(e) => setKind(e.target.value as AdminSearchKind)}
        aria-label="Tipo de resultado"
      >
        {KIND_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {hits.length ? (
        <ul className="id-search__drop admin-search__drop">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <a href={h.href} className="id-search__hit" onClick={() => setQ('')}>
                <IdBadge id={h.id} kind={h.kind} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="block truncate font-semibold">{h.label}</span>
                  {h.meta ? <span className="block truncate text-xs text-slate-500">{h.meta}</span> : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : q.trim().length >= 2 ? (
        <p className="admin-search__empty">Sin resultados para esta búsqueda.</p>
      ) : null}
    </div>
  );
}
