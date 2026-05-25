import { PublicFooter } from '@/components/public/PublicFooter';
import { HelpCenterHeader } from './HelpCenterHeader';
import { HelpHubPage } from './HelpHubPage';

export function HelpCenterPage() {
  return (
    <>
      <HelpCenterHeader />
      <main className="help-hub help-hub--public" id="main-content">
        <HelpHubPage />
      </main>
      <PublicFooter />
    </>
  );
}
