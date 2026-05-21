import type { GuideScreenshot } from '@/lib/guide/types';

/** Muestra captura real del portal (PNG generado desde el PdP). */
export function HelpPdpScreen({ shot, label = 'Portal del paciente' }: { shot: GuideScreenshot; label?: string }) {
  return (
    <figure className="help-pdp-screen">
      <div className="help-pdp-screen__frame">
        <span className="help-pdp-screen__label">{label}</span>
        <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
      </div>
      {shot.caption ? <figcaption>{shot.caption}</figcaption> : null}
    </figure>
  );
}
