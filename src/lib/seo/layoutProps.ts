import { defaultOgImage } from '@/lib/seo/siteConfig';
import { canonicalForPath, publicPageSeo } from '@/lib/seo/publicPages';

export function seoLayoutProps(path: keyof typeof publicPageSeo) {
  const page = publicPageSeo[path];
  if (!page) {
    throw new Error(`SEO no configurado para la ruta ${path}`);
  }
  const ogTitle = page.ogTitle ?? page.title;
  const ogDescription = page.ogDescription ?? page.description;
  const ogImage = defaultOgImage();

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    canonical: canonicalForPath(page.path),
    ogTitle,
    ogDescription,
    ogType: 'website' as const,
    ogLocale: 'es_ES',
    ogImage,
    twitterCard: 'summary_large_image' as const,
    twitterTitle: ogTitle,
    twitterDescription: ogDescription,
    twitterImage: ogImage
  };
}
