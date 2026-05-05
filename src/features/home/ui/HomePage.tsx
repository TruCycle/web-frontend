import { useAuthSession } from '@/shared/context/useAuthSession'
import { LandingDashboardSection } from '@/features/home/ui/components/LandingDashboardSection'
import { LandingFooter } from '@/features/home/ui/components/LandingFooter'
import { LandingFoundItemsSection } from '@/features/home/ui/components/LandingFoundItemsSection'
import { LandingHero } from '@/features/home/ui/components/LandingHero'
import { LandingHowItWorks } from '@/features/home/ui/components/LandingHowItWorks'
import { LandingNavbar } from '@/features/home/ui/components/LandingNavbar'
import { LandingWhyItWorks } from '@/features/home/ui/components/LandingWhyItWorks'

export default function HomePage() {
  const { isAuthenticated } = useAuthSession()
  const primaryCtaTo = isAuthenticated ? '/dashboard' : '/signup'
  const primaryCtaLabel = isAuthenticated ? 'Open dashboard' : 'Get Started'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(164,245,166,0.18)_0%,_rgba(248,250,252,0.98)_28%,_#f8fafc_100%)] text-slate-900">
      <LandingNavbar isAuthenticated={isAuthenticated} primaryCtaLabel={primaryCtaLabel} primaryCtaTo={primaryCtaTo} />
      <LandingHero isAuthenticated={isAuthenticated} primaryCtaLabel={primaryCtaLabel} primaryCtaTo={primaryCtaTo} />
      <LandingDashboardSection />
      <LandingFoundItemsSection isAuthenticated={isAuthenticated} />
      <LandingHowItWorks />
      <LandingWhyItWorks />
      <LandingFooter isAuthenticated={isAuthenticated} primaryCtaLabel={primaryCtaLabel} primaryCtaTo={primaryCtaTo} />
    </main>
  )
}
