import type { RoleModule } from '@/lib/landing/productExperienceContent';

const IMAGES: Record<RoleModule['illustration'], { src: string; alt: string }> = {
  agenda: {
    src: '/images/guides/mobile/admin-agenda.png',
    alt: 'Ilustración de agenda clínica en Dentista+'
  },
  report: {
    src: '/img/informes.webp',
    alt: 'Ilustración de informes clínicos en Dentista+'
  },
  billing: {
    src: '/images/guides/mobile/admin-facturas.png',
    alt: 'Ilustración de facturación en Dentista+'
  },
  portal: {
    src: '/images/guides/mobile/pdp-inicio.png',
    alt: 'Ilustración del portal del paciente en Dentista+'
  }
};

export function RoleModuleIllustration({ illustration }: { illustration: RoleModule['illustration'] }) {
  const img = IMAGES[illustration];
  return (
    <figure className="ps-role-mod__illus" role="img" aria-label={img.alt}>
      <img src={img.src} alt="" loading="lazy" decoding="async" />
    </figure>
  );
}
