import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { HelpHubPage } from './HelpHubPage';

export function HelpCenterPage() {
  return (
    <>
      <PublicHeader activeHref="/ayuda" />
      <main className="help-hub">
        <HelpHubPage />
      </main>
      <PublicFooter />
    </>
  );
}
