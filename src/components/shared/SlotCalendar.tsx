import type { SlotCell } from '@/lib/slots';

export function SlotCalendar({
  slots,
  value,
  onChange
}: {
  slots: SlotCell[];
  value: string;
  onChange: (time: string) => void;
}) {
  if (!slots.length) {
    return <p className="slot-cal__empty">No hay franjas ese día. Prueba otra fecha.</p>;
  }

  const free = slots.filter((s) => s.status === 'libre').length;
  const busy = slots.filter((s) => s.status === 'ocupado').length;

  return (
    <div className="slot-cal">
      <div className="slot-cal__legend">
        <span><i className="slot-cal__dot slot-cal__dot--free" /> Libre ({free})</span>
        <span><i className="slot-cal__dot slot-cal__dot--busy" /> Ocupado ({busy})</span>
        <span><i className="slot-cal__dot slot-cal__dot--block" /> Bloqueado</span>
      </div>
      <div className="slot-cal__grid" role="listbox" aria-label="Horas disponibles">
        {slots.map((s) => (
          <button
            key={s.time}
            type="button"
            role="option"
            aria-selected={value === s.time}
            disabled={!s.selectable}
            className={`slot-cal__cell slot-cal__cell--${s.status} ${value === s.time ? 'slot-cal__cell--picked' : ''}`}
            onClick={() => onChange(s.time)}
          >
            {s.time}
          </button>
        ))}
      </div>
    </div>
  );
}
