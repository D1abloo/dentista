import type { Notice } from '@/types/app';

export function Toast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  const styles =
    notice.type === 'error'
      ? 'bg-rose-50 text-rose-900 ring-rose-200'
      : notice.type === 'info'
        ? 'bg-sky-50 text-sky-900 ring-sky-200'
        : 'bg-emerald-50 text-emerald-900 ring-emerald-200';
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${styles}`} role="status">
      <span>{notice.message}</span>
      <button type="button" onClick={onClose} className="font-black opacity-60 hover:opacity-100" aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
