import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type FaqItem = {
  readonly answer: string
  readonly question: string
}

const faqItems: readonly FaqItem[] = [
  {
    answer:
      'Items are offered free between neighbours. Agree collection arrangements directly; consider any travel or transport costs before accepting an item.',
    question: 'Is it really free?',
  },
  {
    answer:
      "Offer useful items you have the right to give away. Describe their condition and any faults honestly. Check the terms before posting.",
    question: 'What can I list?',
  },
  {
    answer:
      "Browse the current offers to see what is listed. Availability depends on what people have posted; a listing does not guarantee a successful collection.",
    question: 'How do I find available items?',
  },
  {
    answer:
      'The giver and recipient agree a time and place directly. Check the item details, owner permission, access and transport needs before travelling.',
    question: 'How does a handover work?',
  },
  {
    answer:
      'Only offer items you have permission to give away, and arrange an agreed handoff. A spotted item is a report of something seen, not permission to take it. Check ownership and permission before collecting.',
    question: 'Can I take a spotted item?',
  },
] as const

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'faq-schema'
    script.textContent = JSON.stringify(faqSchema)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return (
    <section className="bg-tc-brand-haze px-4 py-20 sm:px-6 sm:py-[88px]" id="faq">
      <div className="mx-auto grid max-w-[1184px] gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
        <div className="max-w-[20rem]">
          <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
            Common questions
          </p>
          <h2 className="mt-3.5 text-[clamp(2rem,3.8vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-tc-brand-ink">
            <span className="block">Stuff people</span>
            <span className="block text-tc-brand-ink">usually ask.</span>
          </h2>
          <p className="mt-3.5 text-[15px] leading-[22px] text-tc-brand-body">
            Can&apos;t see your question? Drop us a note at{' '}
            <a className="font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black" href="mailto:hello@trucycle.co.uk">
              hello@trucycle.co.uk
            </a>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div className="rounded-tc-lg border border-tc-brand-line bg-white px-5 py-3 sm:px-6" key={item.question}>
                <button
                  aria-expanded={isOpen}
                  className="flex min-h-11 w-full items-center justify-between gap-6 bg-transparent p-0 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span className="max-w-3xl text-lg font-semibold leading-6 text-tc-brand-ink">
                    {item.question}
                  </span>
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isOpen
                        ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
                        : 'border-tc-brand-mintLine bg-tc-brand-mintSoft text-tc-brand-deep'
                    }`}
                  >
                    {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {isOpen ? (
                  <p className="mb-2 mt-1 max-w-[640px] pr-12 text-[15px] leading-6 text-tc-brand-body">
                    {item.answer}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
