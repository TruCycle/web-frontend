import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserRole, type UserRole } from '@/shared/context/useUserRole'
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
  readonly role: UserRole
  readonly sectionId: string
  readonly faqId: string | null
}

const supportContentByRole: Record<UserRole, SupportContent> = {
  collector: {
    defaultSection: 'getting-started',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        faqs: [
          {
            id: 'collector-create-account',
            question: 'How do I create an account?',
            answer:
              'Open the signup page, choose Collector, verify your email, and complete your profile.',
          },
          {
            id: 'collector-role-difference',
            question: 'What is the difference between a Collector and Donor account?',
            answer:
              'Collectors browse and claim listed items, while Donors publish available items for exchange.',
          },
          {
            id: 'collector-pricing',
            question: 'Is TruCycle free to use?',
            answer: 'Yes. Basic account usage is free for both collectors and donors.',
          },
        ],
      },
      {
        id: 'listing-items',
        title: 'Listing Items',
        faqs: [],
      },
      {
        id: 'claiming-items',
        title: 'Claiming Items',
        faqs: [],
      },
      {
        id: 'safety-trust',
        title: 'Safety & Trust',
        faqs: [],
      },
      {
        id: 'rewards-impact',
        title: 'Rewards & Impact',
        faqs: [],
      },
      {
        id: 'account-settings',
        title: 'Account & Settings',
        faqs: [],
      },
    ],
  },
  donor: {
    defaultSection: 'listing-items',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        faqs: [],
      },
      {
        id: 'listing-items',
        title: 'Listing Items',
        faqs: [
          {
            id: 'donor-what-list',
            question: 'What items can I list?',
            answer:
              'You can list reusable household items, electronics, books, clothing, and more.',
          },
          {
            id: 'donor-how-list',
            question: 'How do I list an item?',
            answer: 'Click "List New Item", add photos and details, then submit for listing.',
          },
          {
            id: 'donor-listing-duration',
            question: 'How long does an item stay listed?',
            answer:
              'Listings remain active until collected or manually removed from your dashboard.',
          },
        ],
      },
      {
        id: 'claiming-items',
        title: 'Claiming Items',
        faqs: [],
      },
      {
        id: 'safety-trust',
        title: 'Safety & Trust',
        faqs: [],
      },
      {
        id: 'rewards-impact',
        title: 'Rewards & Impact',
        faqs: [],
      },
      {
        id: 'account-settings',
        title: 'Account & Settings',
        faqs: [],
      },
    ],
  },
}

const validRoles: readonly UserRole[] = ['collector', 'donor']

export default function SupportFaqPage() {
  const { role } = useUserRole()
  const { viewRole } = useParams<{ readonly viewRole?: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expansionState, setExpansionState] = useState<ExpansionState>(() => ({
    role,
    sectionId: supportContentByRole[role].defaultSection,
    faqId: null,
  }))

  useEffect(() => {
    if (!viewRole || !validRoles.includes(viewRole as UserRole)) {
      navigate(`/support/${role}`, { replace: true })
      return
    }

    if (viewRole !== role) {
      navigate(`/support/${role}`, { replace: true })
    }
  }, [navigate, role, viewRole])

  const expandedSectionId =
    expansionState.role === role
      ? expansionState.sectionId
      : supportContentByRole[role].defaultSection

  const expandedFaqId =
    expansionState.role === role
      ? expansionState.faqId
      : null

  const filteredSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const roleContent = supportContentByRole[role]

    if (normalizedQuery.length === 0) {
      return roleContent.sections
    }

    return roleContent.sections
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
  }, [role, searchQuery])

  return (
    <div className="mx-auto max-w-[1120px]">
      <header className="mb-[1.1rem]">
        <h1 className="m-0 text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900 max-[1024px]:text-[1.8rem] max-md:text-[1.5rem]">
          Welcome back, Pearl!
        </h1>
        <p className="mt-[0.45rem] text-base text-slate-500 max-md:text-[0.92rem]">
          Track your impact and manage your listings
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-slate-100 p-[1.4rem] max-md:rounded-xl max-md:p-4">
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
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white" key={section.id}>
                <button
                  className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-[1.1rem] py-[0.95rem] text-left text-[0.99rem] font-bold text-slate-900 max-md:px-4 max-md:py-[0.85rem] max-md:text-[0.94rem]"
                  onClick={() =>
                    setExpansionState((current) => {
                      const currentSectionId =
                        current.role === role
                          ? current.sectionId
                          : supportContentByRole[role].defaultSection

                      return {
                        role,
                        sectionId: currentSectionId === section.id ? '' : section.id,
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
                      'shrink-0 text-slate-400 transition',
                      isOpen && 'rotate-180',
                    )}
                    size={16}
                  />
                </button>

                {isOpen && section.faqs.length > 0 && (
                  <ul className="m-0 list-none px-[1.1rem] pb-3 max-md:px-4 max-md:pb-[0.65rem]">
                    {section.faqs.map((faq) => {
                      const isFaqOpen = expandedFaqId === faq.id

                      return (
                        <li key={faq.id}>
                          <button
                            className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-[0.6rem] text-left text-[0.92rem] text-slate-700 max-md:py-[0.52rem] max-md:text-[0.89rem]"
                            onClick={() =>
                              setExpansionState((current) => {
                                const currentFaqId =
                                  current.role === role
                                    ? current.faqId
                                    : null

                                return {
                                  role,
                                  sectionId: expandedSectionId,
                                  faqId: currentFaqId === faq.id ? null : faq.id,
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

        <section className="mt-[1.1rem] rounded-xl border border-slate-200 bg-white p-[1.1rem] max-md:p-4">
          <h3 className="m-0 text-[0.95rem] font-bold text-slate-900">Other ways to reach us</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 max-[1024px]:grid-cols-2 max-md:grid-cols-1 max-md:gap-[0.9rem]">
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <Mail aria-hidden size={14} className="shrink-0" />
                Email
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-slate-600">support@trucycle.com</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-slate-600">Response time: 24 hours</p>
            </article>
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <Phone aria-hidden size={14} className="shrink-0" />
                Phone
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-slate-600">+44 (0)20 1234 5678</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-slate-600">Mon-Fri 9am-6pm GMT</p>
            </article>
            <article>
              <p className="mb-[0.45rem] inline-flex items-center gap-1.5 text-[0.86rem] font-bold text-slate-900">
                <MessageCircle aria-hidden size={14} className="shrink-0" />
                Live Chat
              </p>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-slate-600">Available during business hours</p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-slate-600">Mon-Fri 9am-6pm GMT</p>
            </article>
          </div>
        </section>
      </section>
    </div>
  )
}
