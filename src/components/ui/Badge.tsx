const map: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmada: 'bg-sky-50 text-sky-800 ring-sky-200',
  completada: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelada: 'bg-slate-100 text-slate-600 ring-slate-200',
  no_asistio: 'bg-rose-50 text-rose-800 ring-rose-200',
  reprogramada: 'bg-violet-50 text-violet-800 ring-violet-200',
  pagado: 'bg-emerald-50 text-emerald-800 ring-emerald-200'
};

export function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {label}
    </span>
  );
}
