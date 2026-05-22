import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { HelpDocsPage } from './HelpDocsPage';

export function HelpCenterPage() {
  return (
    <>
      <PublicHeader activeHref="/ayuda" />
      <main className="help-hub help-hub--docs">
        <HelpDocsPage />
      </main>
      <PublicFooter />
    </>
  );
}
