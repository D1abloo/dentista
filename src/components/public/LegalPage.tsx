import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="legal-page shell">
        <h1>{title}</h1>
        {children}
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}
