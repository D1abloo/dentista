export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__icon" aria-hidden>
        <span />
      </div>
      <p className="ui-empty__title">{title}</p>
      {text ? <p className="ui-empty__text">{text}</p> : null}
    </div>
  );
}
