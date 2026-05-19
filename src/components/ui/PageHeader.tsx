export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="ph">
      <h2 className="ph__title">{title}</h2>
      {subtitle ? <p className="ph__sub">{subtitle}</p> : null}
    </header>
  );
}
