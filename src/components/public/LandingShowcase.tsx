import type { ShowcaseItem } from '@/data/landingShowcases';

export function LandingShowcase({
  id,
  title,
  lead,
  items
}: {
  id: string;
  title: string;
  lead: string;
  items: ShowcaseItem[];
}) {
  return (
    <section id={id} className="lp-section lp-showcase shell">
      <header className="lp-section__head">
        <h2>{title}</h2>
        <p>{lead}</p>
      </header>
      <div className="lp-showcase__grid">
        {items.map((item) => (
          <article key={item.src} className="lp-showcase__card">
            <div className="lp-showcase__img-wrap">
              <img src={item.src} alt={item.title} loading="lazy" width={280} height={560} />
            </div>
            <div className="lp-showcase__body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul className="lp-showcase__tags">
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
