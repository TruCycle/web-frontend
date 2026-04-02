import { LegalPageLayout } from '@/features/legal/ui/LegalPageLayout'

const termsSections = [
  {
    title: 'Using TruCycle',
    body: 'By using TruCycle, you agree to provide accurate account information, act respectfully with other users, and avoid misuse of listings, messaging, or exchange flows.',
  },
  {
    title: 'Listings And Exchanges',
    body: 'Users are responsible for the accuracy of item details, availability, and any arrangements made through the platform. TruCycle helps coordinate the flow but does not guarantee each exchange outcome.',
  },
  {
    title: 'Accounts And Access',
    body: 'We may suspend or limit access where necessary to protect users, prevent misuse, or maintain the security and reliability of the service.',
  },
] as const

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Terms"
      title="Terms Of Use"
      intro="These terms describe the core rules for using TruCycle and participating in listings, messaging, and exchanges."
      sections={termsSections}
    />
  )
}