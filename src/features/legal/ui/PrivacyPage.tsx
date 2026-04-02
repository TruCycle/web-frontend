import { LegalPageLayout } from '@/features/legal/ui/LegalPageLayout'

const privacySections = [
  {
    title: 'What We Collect',
    body: 'We collect the details needed to run TruCycle, such as your name, email address, location details for item exchange, and the activity you create inside the app.',
  },
  {
    title: 'How We Use It',
    body: 'We use your information to power listings, support exchanges, secure accounts, improve product performance, and keep core app features working reliably.',
  },
  {
    title: 'How We Protect It',
    body: 'We limit access to your data, use standard security controls, and only keep information for as long as it is needed to provide the service or meet legal obligations.',
  },
] as const

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This page explains the basics of how TruCycle handles your information while you use the platform."
      sections={privacySections}
    />
  )
}