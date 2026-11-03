import { LegalPageLayout } from '@/features/legal/ui/LegalPageLayout'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { useTrackingConsent } from '@/shared/hooks/useTrackingConsent'
import { Button } from '@/shared/ui/button/Button'

const cookieSections = [
  {
    title: 'What Cookies We Use',
    body: 'TruCycle uses a small number of cookies and similar technologies to remember consent choices, measure site usage, and understand whether marketing activity is helping people discover the platform.',
  },
  {
    title: 'Why We Use Them',
    body: 'These technologies help us keep the site functioning smoothly, understand which pages and journeys are useful, and measure campaign performance so we can improve how TruCycle grows.',
  },
  {
    title: 'Your Choices',
    body: 'You can choose whether analytics and marketing cookies are allowed. If you do not accept them, TruCycle will continue to work, but we will not activate optional tracking tools until you give permission.',
  },
] as const

export default function CookiesPage() {
  const { status, accept, reject } = useTrackingConsent()
  usePageMeta({
    title: 'Cookie Policy — TruCycle',
    description:
      'How TruCycle uses cookies and similar technologies, and how your choices affect optional tracking.',
    canonicalPath: '/cookies',
  })

  return (
    <LegalPageLayout
      eyebrow="Cookies"
      title="Cookie Policy"
      intro="This page explains how TruCycle uses cookies and similar technologies, what they help us do, and how your choices affect optional tracking."
      sections={cookieSections}
    >
      <section className="rounded-[22px] border border-slate-200 bg-white p-6" aria-labelledby="cookie-preferences">
        <h2 id="cookie-preferences" className="text-xl font-semibold">Cookie preferences</h2>
        <p className="my-3 text-sm text-slate-600" role="status">
          Optional tracking is {status === 'accepted' ? 'allowed' : 'off'}. You can change your choice here.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="primary" onClick={accept}>Allow optional tracking</Button>
          <Button type="button" variant="secondary" onClick={reject}>Reject optional tracking</Button>
        </div>
      </section>
    </LegalPageLayout>
  )
}
