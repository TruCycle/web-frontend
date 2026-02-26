import type { ReactNode } from 'react'
import logoSrc from '@/assets/logo.svg'
import checkIconSrc from '@/assets/icons/check.svg'
import starIconSrc from '@/assets/icons/star.svg'
import { classNames } from '@/shared/utils/classNames'

const defaultBenefits = [
  'Free forever',
  'No hidden fees',
  '£10 reward for your first exchange',
]

interface AuthShowcaseProps {
  readonly quote: string
  readonly avatarLabel?: string
  readonly avatarSrc?: string
  readonly dateLabel?: string
}

interface AuthPageFrameProps {
  readonly formTitle: string
  readonly formDescription: string
  readonly children: ReactNode
  readonly footer?: ReactNode
  readonly className?: string
  readonly showcase?: AuthShowcaseProps
}

function AuthShowcasePanel({
  quote,
  avatarLabel = 'SL',
  avatarSrc,
  dateLabel = 'Jan 2026',
}: AuthShowcaseProps) {
  return (
    <aside className="flex h-full basis-[50%] flex-col justify-between gap-7 rounded-[25px] bg-tc-auth-hero px-[6rem] py-8 text-tc-auth-heroText max-[900px]:hidden">
      <div className="inline-flex w-fit items-center gap-2.5">
        <img
          alt=""
          aria-hidden
          className="h-[2.1rem] w-[2.1rem] shrink-0"
          src={logoSrc}
        />
        <span className="text-[1.8rem] font-bold text-tc-auth-heroBrand max-sm:text-2xl">
          TruCycle
        </span>
      </div>

      <section className="my-auto flex flex-col gap-8">
        <h1 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] tracking-[-0.02em] text-tc-auth-heroTitle">
          Join London&apos;s
          <br />
          <span className="font-bold tracking-[0.01em] text-tc-auth-heroAccent">
            circular economy.
          </span>
        </h1>
        <ul className="grid list-none gap-[0.65rem] p-0">
          {defaultBenefits.map((benefit) => (
            <li
              key={benefit}
              className="inline-flex items-center gap-[0.55rem] text-base text-tc-auth-quote"
            >
              <img alt="" aria-hidden className="h-[1.02rem] w-[1.02rem] shrink-0" src={checkIconSrc} />
              {benefit}
            </li>
          ))}
        </ul>

        <article className="rounded-[20px] border border-1.5 border-tc-auth-testimonialBorder bg-tc-auth-card px-10 py-8 shadow-tc-auth-card">
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img
                alt="Sophie, London"
                className="h-[50px] w-[50px] rounded-full object-cover"
                src={avatarSrc}
              />
            ) : (
              <span
                aria-hidden
                className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-full bg-tc-auth-avatar text-[0.8rem] font-bold text-tc-auth-avatarText"
              >
                {avatarLabel}
              </span>
            )}
            <div>
              <p className="m-0 text-base text-tc-auth-author">
                Sophie, London
              </p>
              <p className="mt-[0.15rem] text-sm text-tc-auth-authorRole">
                Sustainable Living Enthusiast
              </p>
            </div>
          </div>
          <p className="my-4 text-md text-tc-auth-quote">
            {quote}
          </p>
          <div className="flex items-center justify-between text-xs text-tc-auth-meta">
            <span>{dateLabel}</span>
            <span aria-hidden className="inline-flex items-center gap-0">
              {Array.from({ length: 5 }, (_, index) => (
                <img
                  key={`star-${index + 1}`}
                  alt=""
                  className="h-6 w-6 shrink-0"
                  src={starIconSrc}
                />
              ))}
            </span>
          </div>
        </article>
      </section>

    </aside>
  )
}

export function AuthPageFrame({
  formTitle,
  formDescription,
  children,
  footer,
  className,
  showcase,
}: AuthPageFrameProps) {
  return (
    <main
      className={classNames(
        'flex h-screen overflow-hidden bg-tc-auth-page p-3 max-[900px]:p-0',
        className,
      )}
    >
      <div className="flex h-full w-full overflow-hidden bg-tc-auth-panel">
        <AuthShowcasePanel
          quote={
            showcase?.quote ??
            'TruCycle makes donating my unused items easy, secure, and rewarding!'
          }
          avatarLabel={showcase?.avatarLabel}
          avatarSrc={showcase?.avatarSrc}
          dateLabel={showcase?.dateLabel}
        />

        <section className="flex h-full basis-[50%] flex-col overflow-y-auto px-[6rem] py-[5rem] max-[900px]:basis-full max-[900px]:px-[3rem] max-[900px]:pb-[3rem] max-[900px]:pt-[2.4rem] max-sm:px-[2rem] max-sm:pb-8 max-sm:pt-[3rem]">
          <h2 className="m-0 font-medium text-[clamp(1.7rem,2.4vw,2rem)] text-tc-auth-formTitle">
            {formTitle}
          </h2>
          <p className="mt-[0.55rem] text-tc-auth-formText">{formDescription}</p>
          {children}
          {footer}
        </section>
      </div>
    </main>
  )
}

export const authFieldClassName = 'grid gap-2'
export const authLabelClassName = 'text-tc-auth-label'
export const authInputClassName =
  'h-12 w-full rounded-[0.55rem] border border-tc-auth-inputBorder px-[0.95rem] text-[0.95rem] text-tc-app-text transition placeholder:text-tc-auth-inputPlaceholder focus:border-tc-auth-inputFocus focus:outline-none focus:ring-4 focus:ring-tc-auth-inputFocusRing'
export const authPasswordToggleClassName =
  'absolute right-[0.6rem] top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-0 text-tc-auth-icon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-auth-inputFocus'
export const authPrimaryButtonClassName =
  'inline-flex h-[3.05rem] items-center justify-center gap-2 rounded-[0.55rem] border-0 bg-tc-auth-submit px-4 text-lg font-bold text-tc-auth-submitText transition hover:-translate-y-px hover:brightness-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tc-auth-submitFocus disabled:cursor-not-allowed disabled:opacity-70 max-sm:text-xl'
export const authInlineMetaClassName =
  'text-[0.92rem] text-tc-auth-row'
export const authFooterCopyClassName = 'mt-[1rem] text-center text-tc-auth-muted'
export const authFooterLinkClassName =
  'font-semibold text-tc-auth-link no-underline hover:underline'
export const authLoadingSpinnerClassName =
  'inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-2 border-tc-auth-submitText/20 border-t-tc-auth-submitText'
