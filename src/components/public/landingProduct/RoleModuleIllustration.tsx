import type { RoleModule } from '@/lib/landing/productExperienceContent';
import { brandImageAlts, brandImages } from '@/lib/brand/assets';

const IMAGES: Record<RoleModule['illustration'], { src: string; alt: string }> = {
  agenda: {
    src: brandImages.citas,
    alt: brandImageAlts.citas
  },
  report: {
    src: brandImages.informes,
    alt: brandImageAlts.informes
  },
  billing: {
    src: brandImages.informes,
    alt: 'Facturación dental en AgendaClinic'
  },
  portal: {
    src: brandImages.inicio,
    alt: brandImageAlts.inicio
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
