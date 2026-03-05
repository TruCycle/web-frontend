import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { classNames } from '@/shared/utils/classNames'

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
              'Contact support from this page using email or phone and we will guide you through verification and deletion.',
          },
        ],
      },
    ],
}

export default function SupportFaqPage() {
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
      <header className="mb-[1.1rem]">
        <h1 className="m-0 text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900 max-[1024px]:text-[1.8rem] max-md:text-[1.5rem]">
          Welcome back, Pearl!
        </h1>
        <p className="mt-[0.45rem] text-base text-slate-500 max-md:text-[0.92rem]">
          Track your impact and manage your listings
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-[1.4rem] max-md:rounded-xl max-md:p-4">
        <h2 className="m-0 text-[1.05rem] font-bold text-slate-900">Frequently Asked Questions</h2>

        <label
          className="mt-4 flex h-11 items-center gap-[0.55rem] rounded-lg border border-slate-200 bg-white px-3 text-slate-400"
          htmlFor="support-faq-search"
        >
          <Search aria-hidden size={16} className="shrink-0" />
          <input
            id="support-faq-search"
            className="h-full w-full border-0 bg-transparent text-[0.92rem] text-slate-700 outline-none placeholder:text-slate-400"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Search FAQ..."
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="mt-4 grid gap-3">
          {filteredSections.map((section) => {
            const isOpen = expandedSectionId === section.id

            return (
              <article className="overflow-hidden rounded-xl border border-[#64748B40] bg-white shadow-[0px_3px_3.75px_0px_#64748B1A]" key={section.id}>
                <button
                  className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-[2rem] py-[0.95rem] text-left text-[0.99rem] font-medium text-slate-900 max-md:px-4 max-md:py-[0.85rem] max-md:text-[0.94rem]"
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
                      'shrink-0 text-[#46B3A7] transition',
                      isOpen && 'rotate-180',
                    )}
                    size={16}
                  />
                </button>

                {isOpen && section.faqs.length > 0 && (
                  <ul className="m-0 list-none px-[2rem] pb-3 max-md:px-4 max-md:pb-[0.65rem]">
                    {section.faqs.map((faq) => {
                      const isFaqOpen = expandedFaqId === faq.id

                      return (
                        <li key={faq.id}>
                          <button
                            className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-[0.6rem] text-left text-[0.92rem] text-slate-700 max-md:py-[0.52rem] max-md:text-[0.89rem]"
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
                                'shrink-0 text-slate-400 transition',
                                isFaqOpen && 'rotate-180',
                              )}
                              size={14}
                            />
                          </button>
                          {isFaqOpen && (
                            <p className="mb-2 pr-2 text-[0.9rem] leading-[1.5] text-slate-500">
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

        <section className="mt-[2rem] rounded-xl border border-[#64748B40] bg-white shadow-[0px_3px_3.75px_0px_#64748B1A] p-[2rem] max-md:p-4">
          <h3 className="m-0 text-[0.95rem] font-bold text-slate-900">Other ways to reach us</h3>
          <div className="mt-5 grid grid-cols-3 gap-4 max-[1024px]:grid-cols-2 max-md:grid-cols-1 max-md:gap-[0.9rem]">
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <Mail aria-hidden size={14} className="shrink-0" />
                Email
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-[#121212BF]">support@trucycle.com</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-[#12121299]">Response time: 24 hours</p>
            </article>
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <Phone aria-hidden size={14} className="shrink-0" />
                Phone
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-[#121212BF]">+44 (0)20 1234 5678</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-[#12121299]">Mon-Fri 9am-6pm GMT</p>
            </article>
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <MessageCircle aria-hidden size={14} className="shrink-0" />
                Live Chat
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-[#121212BF]">Available during business hours</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-[#12121299]">Mon-Fri 9am-6pm GMT</p>
            </article>
          </div>
        </section>
      </section>
    </div>
  )
}
