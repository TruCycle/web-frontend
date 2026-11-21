import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Mail, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { classNames } from '@/shared/utils/classNames'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

interface FaqItem {
  readonly id: string
  readonly question: string
  readonly answer: string
}

interface FaqSection {
  readonly id: string
  readonly title: string
  readonly faqs: readonly FaqItem[]
}

interface SupportContent {
  readonly defaultSection: string
  readonly sections: readonly FaqSection[]
}

interface ExpansionState {
  readonly sectionId: string
  readonly faqId: string | null
}

const supportContent: SupportContent = {
    defaultSection: 'getting-started',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        faqs: [
          {
            id: 'create-account',
            question: 'How do I create an account?',
            answer:
              'Open the signup page, complete your details, verify your email, and sign in to access dashboard features.',
          },
          {
            id: 'role-switching',
            question: 'What is the difference between a Collector and Donor account?',
            answer:
              'Collectors browse and claim items, while Donors create listings. You can switch between both modes using the role toggle in the sidebar.',
          },
          {
            id: 'pricing',
            question: 'Is TruCycle free to use?',
            answer: 'Yes. Basic account usage is free for both collectors and donors.',
          },
          {
            id: 'first-steps',
            question: 'What should I do after signing in for the first time?',
            answer:
              'Set your location, review your profile details, and then either browse items (Collector) or create your first listing (Donor).',
          },
        ],
      },
      {
        id: 'listing-items',
        title: 'Listing Items',
        faqs: [
          {
            id: 'what-to-list',
            question: 'What items can I list?',
            answer:
              'You can list reusable household items, electronics, books, clothing, furniture, and similar items in fair condition.',
          },
          {
            id: 'how-to-list',
            question: 'How do I list a new item?',
            answer:
              'Open your dashboard, click "List New Item", upload images, add category/condition details, and publish.',
          },
          {
            id: 'listing-photos',
            question: 'How many photos should I add?',
            answer:
              'Add at least one clear cover image. Multiple photos are recommended to show item condition from different angles.',
          },
          {
            id: 'edit-remove-listing',
            question: 'Can I edit or remove a listing?',
            answer:
              'Yes. Open "My Listed Items" and use the available actions to view details, update listing info, or remove the item.',
          },
        ],
      },
      {
        id: 'claiming-items',
        title: 'Claiming Items',
        faqs: [
          {
            id: 'how-to-claim',
            question: 'How do I claim an item?',
            answer:
              'From Browse Items, open an item and click "Request a Claim". The donor reviews and approves the request.',
          },
          {
            id: 'claim-status',
            question: 'Where can I track claim status?',
            answer:
              'Open "My Selected Items" to see whether a claim is pending, approved, or completed.',
          },
          {
            id: 'pickup-process',
            question: 'How is pickup confirmed?',
            answer:
              'When a claim is approved, use the provided QR flow at handoff to confirm and complete collection.',
          },
          {
            id: 'cancel-claim',
            question: 'Can I cancel a claim request?',
            answer:
              'Yes. If the claim is still pending, you can cancel it from the selected item details before completion.',
          },
        ],
      },
      {
        id: 'safety-trust',
        title: 'Safety & Trust',
        faqs: [
          {
            id: 'safe-meetups',
            question: 'How can I stay safe during handoff?',
            answer:
              'Use verified partner shops when available, meet in well-lit public places, and confirm item details before completion.',
          },
          {
            id: 'report-user',
            question: 'How do I report suspicious behavior?',
            answer:
              'Open the conversation or item details and use the report option, or contact support directly with the listing and user details.',
          },
          {
            id: 'item-accuracy',
            question: 'What if the item condition does not match the listing?',
            answer:
              'Do not complete handoff. Report the issue in-app and include photos so the support team can review quickly.',
          },
          {
            id: 'privacy',
            question: 'Is my personal information shared publicly?',
            answer:
              'No. TruCycle only shows essential profile details required for secure exchanges and communication.',
          },
        ],
      },
      {
        id: 'rewards-impact',
        title: 'Rewards & Impact',
        faqs: [
          {
            id: 'how-rewards-work',
            question: 'How are rewards calculated?',
            answer:
              'Rewards are calculated from completed exchanges and impact actions based on item category, condition, and completion status.',
          },
          {
            id: 'co2-impact',
            question: 'How is environmental impact shown?',
            answer:
              'Impact metrics such as estimated CO2 saved are displayed in your dashboard and update after successful exchanges.',
          },
          {
            id: 'rewards-availability',
            question: 'When will my rewards appear?',
            answer:
              'Rewards are posted after a collection is confirmed and marked completed in the platform workflow.',
          },
          {
            id: 'impact-history',
            question: 'Can I view past impact performance?',
            answer:
              'Yes. The dashboard includes historical summaries so you can track trends in your contribution over time.',
          },
        ],
      },
      {
        id: 'account-settings',
        title: 'Account & Settings',
        faqs: [
          {
            id: 'update-profile',
            question: 'How do I update my profile information?',
            answer:
              'Go to Settings and update your personal details, preferences, and location information.',
          },
          {
            id: 'change-password',
            question: 'How do I change my password?',
            answer:
              'Use the account security section in Settings or the password reset flow from the login page.',
          },
          {
            id: 'notifications',
            question: 'Can I control notifications?',
            answer:
              'Yes. Notification preferences are available in Settings so you can choose relevant alerts.',
          },
          {
            id: 'delete-account',
            question: 'How can I request account deletion?',
            answer:
              'Use the email address below to ask about account deletion.',
          },
        ],
      },
    ],
}

export default function SupportFaqPage() {
  const { user } = useAuthSession()
  const firstName = user?.firstName?.trim()
  usePageMeta({
    title: 'Support & FAQ — TruCycle',
    description:
      'Find answers to common questions about TruCycle, from account setup to item exchanges and safety.',
    noIndex: true,
  })

  const { viewRole } = useParams<{ readonly viewRole?: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expansionState, setExpansionState] = useState<ExpansionState>(() => ({
    sectionId: supportContent.defaultSection,
    faqId: null,
  }))

  useEffect(() => {
    if (viewRole) {
      navigate('/support', { replace: true })
    }
  }, [navigate, viewRole])

  const expandedSectionId = expansionState.sectionId
  const expandedFaqId = expansionState.faqId

  const filteredSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const pageContent = supportContent

    if (normalizedQuery.length === 0) {
      return pageContent.sections
    }

    return pageContent.sections
      .map((section) => {
        const titleMatches = section.title.toLowerCase().includes(normalizedQuery)
        const filteredFaqs = section.faqs.filter((faq) =>
          faq.question.toLowerCase().includes(normalizedQuery),
        )

        if (titleMatches && filteredFaqs.length === 0) {
          return section
        }

        return {
          ...section,
          faqs: filteredFaqs,
        }
      })
      .filter((section) => {
        const titleMatches = section.title.toLowerCase().includes(normalizedQuery)
        return titleMatches || section.faqs.length > 0
      })
  }, [searchQuery])

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="m-0 text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink max-[1024px]:text-[1.8rem] max-md:text-[1.5rem]">
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome back!'}
        </h1>
        <p className="mt-1 text-base leading-6 text-tc-brand-body max-md:text-[0.92rem]">
          Track your impact and manage your listings
        </p>
      </header>

      <section className="rounded-tc-lg border border-tc-brand-line bg-white p-6 max-md:rounded-tc-md max-md:p-4">
        <h2 className="m-0 text-lg font-semibold leading-6 text-tc-brand-ink">Frequently Asked Questions</h2>

        <label
          className="mt-4 flex h-11 items-center gap-[0.55rem] rounded-full border border-tc-brand-control bg-white px-4 text-tc-brand-muted focus-within:border-tc-brand-deep focus-within:ring-2 focus-within:ring-tc-brand-mint"
          htmlFor="support-faq-search"
        >
          <Search aria-hidden size={16} className="shrink-0" />
          <input
            id="support-faq-search"
            className="h-full w-full border-0 bg-transparent text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Search FAQ..."
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="mt-4 grid gap-2.5">
          {filteredSections.map((section) => {
            const isOpen = expandedSectionId === section.id

            return (
              <article className="overflow-hidden rounded-tc-md border border-tc-brand-line bg-white transition has-[ul]:border-tc-brand-mintLine has-[ul]:bg-tc-brand-mintSoft" key={section.id}>
                <button
                  className="flex min-h-11 w-full items-center justify-between gap-3 border-0 bg-transparent px-5 py-4 text-left text-sm font-semibold leading-5 text-tc-brand-ink max-md:px-4 max-md:py-[0.85rem]"
                  onClick={() =>
                    setExpansionState((current) => {
                      return {
                        sectionId: current.sectionId === section.id ? '' : section.id,
                        faqId: null,
                      }
                    })
                  }
                  type="button"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    aria-hidden
                    className={classNames(
                      'shrink-0 text-tc-brand-deep transition',
                      isOpen && 'rotate-180',
                    )}
                    size={16}
                  />
                </button>

                {isOpen && section.faqs.length > 0 && (
                  <ul className="m-0 grid list-none gap-2.5 px-5 pb-4 max-md:px-4 max-md:pb-3 [&>li]:rounded-tc-md [&>li]:border [&>li]:border-tc-brand-line [&>li]:bg-white [&>li]:px-4">
                    {section.faqs.map((faq) => {
                      const isFaqOpen = expandedFaqId === faq.id

                      return (
                        <li key={faq.id}>
                          <button
                            className="flex min-h-11 w-full items-center justify-between gap-3 border-0 bg-transparent py-3 text-left text-sm font-medium leading-5 text-tc-brand-ink"
                            onClick={() =>
                              setExpansionState((current) => {
                                return {
                                  sectionId: expandedSectionId,
                                  faqId: current.faqId === faq.id ? null : faq.id,
                                }
                              })
                            }
                            type="button"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown
                              aria-hidden
                              className={classNames(
                                'shrink-0 text-tc-brand-muted transition',
                                isFaqOpen && 'rotate-180',
                              )}
                              size={14}
                            />
                          </button>
                          {isFaqOpen && (
                            <p className="mb-3 pr-2 text-sm leading-5 text-tc-brand-body">
                              {faq.answer}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </article>
            )
          })}
        </div>

        <section className="mt-6 rounded-tc-md border border-tc-brand-line bg-tc-brand-haze p-5 max-md:p-4">
          <h3 className="m-0 text-base font-semibold leading-6 text-tc-brand-ink">General questions</h3>
          <div className="mt-3">
            <article>
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-tc-brand-ink">
                <Mail aria-hidden size={14} className="shrink-0" />
                Email TruCycle
              </p>
              <a href="mailto:hello@trucycle.co.uk" className="inline-flex min-h-11 items-center text-sm font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black">hello@trucycle.co.uk</a>
            </article>
          </div>
        </section>
      </section>
    </div>
  )
}
