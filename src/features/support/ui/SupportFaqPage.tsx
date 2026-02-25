import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserRole, type UserRole } from '@/shared/context/UserRoleContext'
import './SupportFaqPage.css'

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
  const [expandedSectionId, setExpandedSectionId] = useState(
    supportContentByRole[role].defaultSection,
  )
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  useEffect(() => {
    if (!viewRole || !validRoles.includes(viewRole as UserRole)) {
      navigate(`/support/${role}`, { replace: true })
      return
    }

    if (viewRole !== role) {
      navigate(`/support/${role}`, { replace: true })
    }
  }, [navigate, role, viewRole])

  useEffect(() => {
    setExpandedSectionId(supportContentByRole[role].defaultSection)
    setExpandedFaqId(null)
  }, [role])

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
    <div className="support-content-wrapper">
      <header className="support-header">
        <h1 className="support-title">Welcome back, Pearl!</h1>
        <p className="support-subtitle">Track your impact and manage your listings</p>
      </header>

      <section className="support-card">
        <h2 className="support-section-title">Frequently Asked Questions</h2>

        <label className="support-search" htmlFor="support-faq-search">
          <Search aria-hidden size={16} />
          <input
            id="support-faq-search"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Search FAQ..."
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="support-accordion-list">
          {filteredSections.map((section) => {
            const isOpen = expandedSectionId === section.id

            return (
              <article className="support-accordion-item" key={section.id}>
                <button
                  className="support-accordion-trigger"
                  onClick={() =>
                    setExpandedSectionId((current) => (current === section.id ? '' : section.id))
                  }
                  type="button"
                >
                  <span>{section.title}</span>
                  <ChevronDown aria-hidden className={isOpen ? 'open' : ''} size={16} />
                </button>

                {isOpen && section.faqs.length > 0 && (
                  <ul className="support-faq-list">
                    {section.faqs.map((faq) => {
                      const isFaqOpen = expandedFaqId === faq.id

                      return (
                        <li key={faq.id}>
                          <button
                            className="support-faq-question"
                            onClick={() =>
                              setExpandedFaqId((current) => (current === faq.id ? null : faq.id))
                            }
                            type="button"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown aria-hidden className={isFaqOpen ? 'open' : ''} size={14} />
                          </button>
                          {isFaqOpen && <p className="support-faq-answer">{faq.answer}</p>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </article>
            )
          })}
        </div>

        <section className="support-contact-card">
          <h3>Other ways to reach us</h3>
          <div className="support-contact-grid">
            <article className="support-contact-item">
              <p className="support-contact-title">
                <Mail aria-hidden size={14} />
                Email
              </p>
              <p>support@trucycle.com</p>
              <p>Response time: 24 hours</p>
            </article>
            <article className="support-contact-item">
              <p className="support-contact-title">
                <Phone aria-hidden size={14} />
                Phone
              </p>
              <p>+44 (0)20 1234 5678</p>
              <p>Mon-Fri 9am-6pm GMT</p>
            </article>
            <article className="support-contact-item">
              <p className="support-contact-title">
                <MessageCircle aria-hidden size={14} />
                Live Chat
              </p>
              <p>Available during business hours</p>
              <p>Mon-Fri 9am-6pm GMT</p>
            </article>
          </div>
        </section>
      </section>
    </div>
  )
}
