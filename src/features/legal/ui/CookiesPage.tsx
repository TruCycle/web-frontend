import { LegalPageLayout } from '@/features/legal/ui/LegalPageLayout'

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
  return (
    <LegalPageLayout
      eyebrow="Cookies"
      title="Cookie Policy"
      intro="This page explains how TruCycle uses cookies and similar technologies, what they help us do, and how your choices affect optional tracking."
      sections={cookieSections}
    />
  )
}