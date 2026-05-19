export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label="Progreso">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className={`stepper__item ${done ? 'stepper__item--done' : ''} ${active ? 'stepper__item--active' : ''}`}>
            <span className="stepper__dot">{done ? '✓' : n}</span>
            <span className="stepper__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
