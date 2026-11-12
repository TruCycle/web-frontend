import { LandingCtaSection } from '@/features/home/ui/components/LandingCtaSection'
import { LandingFaqSection } from '@/features/home/ui/components/LandingFaqSection'
import { LandingFeaturedItemsSection } from '@/features/home/ui/components/LandingFeaturedItemsSection'
import { LandingFooter } from '@/features/home/ui/components/LandingFooter'
import { LandingHero } from '@/features/home/ui/components/LandingHero'
import { LandingHowItWorks } from '@/features/home/ui/components/LandingHowItWorks'
import { LandingImpactSection } from '@/features/home/ui/components/LandingImpactSection'
import { LandingNavbar } from '@/features/home/ui/components/LandingNavbar'
import { LandingTestimonialsSection } from '@/features/home/ui/components/LandingTestimonialsSection'
import { LandingWhatWeTakeSection } from '@/features/home/ui/components/LandingWhatWeTakeSection'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useGoogleOneTap } from '@/shared/hooks/useGoogleOneTap'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

export default function HomePage() {
  usePageMeta({
    canonicalPath: '/',
    description: 'Offer useful items free to another neighbour. Browse current offers, check the details, and arrange collection directly with the giver.',
  })
  const { isAuthenticated } = useAuthSession()
  useGoogleOneTap({ redirectTo: '/dashboard', disabled: isAuthenticated })
  const browseTo = '/browse'
  const dashboardTo = isAuthenticated ? '/dashboard' : '/login'
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
      <LandingFeaturedItemsSection />
      <LandingHowItWorks />
      <LandingWhatWeTakeSection />
      <LandingImpactSection
        browseTo={browseTo}
      />
      <LandingTestimonialsSection />
      <LandingCtaSection browseTo={browseTo} postItemTo={postItemTo} spotTo={spotTo} />
      <LandingFaqSection />
      <LandingFooter />
    </main>
  )
}
