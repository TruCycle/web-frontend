import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

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
    <div className="min-h-screen overflow-x-hidden bg-tc-brand-haze text-tc-brand-ink">
      <LandingNavbar
        dashboardTo={dashboardTo}
        isAuthenticated={isAuthenticated}
        postItemTo={postItemTo}
      />
      <main className="[&>section[id]]:scroll-mt-24">
        <LandingHero browseTo={browseTo} postItemTo={postItemTo} />
        <LandingFeaturedItemsSection />
        <LandingHowItWorks />
        <LandingWhatWeTakeSection />
        <LandingImpactSection browseTo={browseTo} />
        <LandingTestimonialsSection />
        <LandingCtaSection browseTo={browseTo} postItemTo={postItemTo} spotTo={spotTo} />
        <LandingFaqSection />
      </main>
      <LandingFooter />
    </div>
  )
}
