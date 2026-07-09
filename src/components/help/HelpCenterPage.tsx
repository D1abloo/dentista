import { PublicSiteShell } from '@/components/public/PublicSiteShell'
import { HelpHubPage } from './HelpHubPage'

export function HelpCenterPage() {
  return (
    <PublicSiteShell>
      <main className="help-hub help-hub--public ac-landing ac-page" id="main-content">
        <HelpHubPage />
      </main>
    </PublicSiteShell>
  )
}
