import type { ReactNode } from 'react';

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`ui-card ${className}`}>
      {title ? (
        <header className="ui-card__head">
          <h2 className="ui-card__title">{title}</h2>
        </header>
      ) : null}
      <div className={title ? 'ui-card__body' : undefined}>{children}</div>
    </section>
  );
}
