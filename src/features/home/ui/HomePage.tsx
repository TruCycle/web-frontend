import { LandingCtaSection } from '@/features/home/ui/components/LandingCtaSection'
import { LandingFaqSection } from '@/features/home/ui/components/LandingFaqSection'
import { LandingFooter } from '@/features/home/ui/components/LandingFooter'
import { LandingHero } from '@/features/home/ui/components/LandingHero'
import { LandingHowItWorks } from '@/features/home/ui/components/LandingHowItWorks'
import { LandingImpactSection } from '@/features/home/ui/components/LandingImpactSection'
import { LandingNavbar } from '@/features/home/ui/components/LandingNavbar'
import { LandingTestimonialsSection } from '@/features/home/ui/components/LandingTestimonialsSection'
import { LandingWhatWeTakeSection } from '@/features/home/ui/components/LandingWhatWeTakeSection'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

export default function HomePage() {
  usePageMeta({ canonicalPath: '/' })
  const { isAuthenticated } = useAuthSession()
  const browseTo = isAuthenticated ? '/browse' : '/signup?intent=collector'
  const dashboardTo = isAuthenticated ? '/dashboard' : '/login'
  const impactTo = isAuthenticated ? '/impact' : '/signup'
  const partnerTo = isAuthenticated ? '/partner/onboard' : '/signup'
  const postItemTo = isAuthenticated ? '/listings' : '/signup?intent=donor'
  const spotTo = isAuthenticated ? '/found-items/post' : '/signup?intent=spotter'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7FBF4] text-tc-app-text">
      <LandingNavbar
        dashboardTo={dashboardTo}
        isAuthenticated={isAuthenticated}
        postItemTo={postItemTo}
      />
      <LandingHero browseTo={browseTo} postItemTo={postItemTo} />
      <LandingHowItWorks />
      <LandingWhatWeTakeSection />
      <LandingImpactSection
        browseTo={browseTo}
        impactTo={impactTo}
        partnerTo={partnerTo}
      />
      <LandingTestimonialsSection />
      <LandingCtaSection browseTo={browseTo} postItemTo={postItemTo} spotTo={spotTo} />
      <LandingFaqSection />
      <LandingFooter />
    </main>
  )
}
