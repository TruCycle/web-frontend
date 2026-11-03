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
    <section className="bg-[#F7FBF4] px-6 py-20 sm:py-24" id="faq">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <div className="max-w-[15.75rem]">
          <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
            Common questions
          </p>
          <h2 className="mt-5 text-[clamp(2.2rem,4vw,3rem)] font-normal leading-[1.1] tracking-[-0.05em] text-[#0B3322]">
            <span className="block">Stuff people</span>
            <span className="block text-[#172033]">usually ask.</span>
          </h2>
          <p className="mt-8 text-base leading-8 text-[#121212B3]">
            Can&apos;t see your question? Drop us a note at{' '}
            <a className="font-semibold text-[#0B3322]" href="mailto:hello@trucycle.co.uk">
              hello@trucycle.co.uk
            </a>.
          </p>
        </div>

        <div className="border-t border-[#CBD5E1]">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div className="border-b border-[#CBD5E1] py-6" key={item.question}>
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-6 bg-transparent p-0 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span className="max-w-3xl text-xl font-normal leading-8 text-[#0B3322] sm:text-[1.12rem]">
                    {item.question}
                  </span>
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isOpen
                        ? 'border-tc-shell-accent bg-tc-shell-accent text-[#0B3322]'
                        : 'border-[#CBD5E1] bg-[#FBFDFB] text-[#0B3322]'
                    }`}
                  >
                    {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {isOpen ? (
                  <p className="mt-4 max-w-3xl pr-12 text-base leading-8 text-[#121212B3]">
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
