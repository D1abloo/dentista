import { PublicSiteShell } from '@/components/public/PublicSiteShell'
import { HelpHubPage } from './HelpHubPage'

export function HelpCenterPage() {
  return (
    <PublicSiteShell>
      <main className="help-hub help-hub--public adb-landing" id="main-content">
        <HelpHubPage />
      </main>
    </PublicSiteShell>
  )
}
