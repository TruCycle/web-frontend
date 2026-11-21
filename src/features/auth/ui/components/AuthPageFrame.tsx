import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import logoSrc from '@/assets/logo.svg'
import checkIconSrc from '@/assets/icons/check.svg'
import starIconSrc from '@/assets/icons/star.svg'
import { classNames } from '@/shared/utils/classNames'

const defaultBenefits = [
  'Free forever',
  'No hidden fees',
  'Easy to get started',
]

interface AuthShowcaseProps {
  readonly quote: string
  readonly avatarLabel?: string
  readonly avatarSrc?: string
  readonly dateLabel?: string
  readonly titlePrefix?: string
  readonly titleAccent?: string
  readonly benefits?: readonly string[]
  readonly authorName?: string
  readonly authorRole?: string
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
  titlePrefix = "Join London's",
  titleAccent = 'circular economy.',
  benefits = defaultBenefits,
  authorName = 'Sophie, London',
  authorRole = 'Sustainable Living Enthusiast',
}: AuthShowcaseProps) {
  return (
    <aside className="flex h-full basis-[50%] flex-col justify-between gap-7 rounded-tc-xl bg-tc-brand-deep p-10 text-tc-brand-onDeep max-[900px]:hidden">
      <div className="inline-flex w-fit items-center gap-2.5">
        <img
          alt=""
          aria-hidden
          className="h-7 w-7 shrink-0"
          src={logoSrc}
        />
        <span className="text-lg font-semibold tracking-[-0.02em] text-white">
          TruCycle
        </span>
      </div>

      <section className="mt-auto flex flex-col gap-7">
        <h2 className="m-0 text-[clamp(2rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
          {titlePrefix}
          <br />
          <span className="text-tc-brand-mint">
            {titleAccent}
          </span>
        </h2>
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="inline-flex items-center gap-2.5 text-sm leading-5 text-tc-brand-onDeep"
            >
              <img alt="" aria-hidden className="h-4 w-4 shrink-0" src={checkIconSrc} />
              {benefit}
            </li>
          ))}
        </ul>

        <article className="rounded-tc-lg border border-tc-brand-deepLine bg-tc-brand-hover p-5">
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img
                alt=""
                className="h-10 w-10 rounded-full object-cover"
                src={avatarSrc}
              />
            ) : (
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tc-brand-mint text-xs font-semibold text-tc-brand-onMint"
              >
                {avatarLabel}
              </span>
            )}
            <div>
              <p className="m-0 text-sm font-semibold leading-5 text-white">
                {authorName}
              </p>
              <p className="m-0 text-[13px] leading-5 text-tc-brand-onDeep">
                {authorRole}
              </p>
            </div>
          </div>
          <p className="my-3 text-sm leading-5 text-tc-brand-onDeep">
            {quote}
          </p>
          <div className="flex items-center justify-between text-xs leading-4 text-tc-brand-onDeep">
            <span>{dateLabel}</span>
            <span aria-hidden className="inline-flex items-center gap-0">
              {Array.from({ length: 5 }, (_, index) => (
                <img
                  key={`star-${index + 1}`}
                  alt=""
                  className="h-5 w-5 shrink-0"
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
  const { pathname } = useLocation()
  const routeTitle = pathname === '/signup' ? 'Create an account' : pathname === '/reset-password' ? 'Reset your password' : pathname === '/auth/verify-email' ? 'Verify your email' : 'Sign in'
  usePageMeta({ title: `${routeTitle} — TruCycle`, description: 'Access your TruCycle account securely.', canonicalPath: pathname, noIndex: true })
  return (
    <main
      className={classNames(
        'flex h-screen overflow-hidden bg-white p-4 text-tc-brand-ink max-[900px]:p-0',
        className,
      )}
    >
      <div className="flex h-full w-full overflow-hidden bg-white">
        <AuthShowcasePanel
          quote={
            showcase?.quote ??
            'TruCycle makes donating my unused items easy, secure, and straightforward.'
          }
          avatarLabel={showcase?.avatarLabel}
          avatarSrc={showcase?.avatarSrc}
          dateLabel={showcase?.dateLabel}
          titlePrefix={showcase?.titlePrefix}
          titleAccent={showcase?.titleAccent}
          benefits={showcase?.benefits}
          authorName={showcase?.authorName}
          authorRole={showcase?.authorRole}
        />

        <section className="flex h-full basis-[50%] flex-col overflow-y-auto px-[max(2.5rem,calc(25%-200px))] py-10 [justify-content:safe_center] max-[900px]:basis-full max-[900px]:px-[max(2.5rem,calc(50%-200px))] max-[900px]:py-10 max-sm:px-5 max-sm:pb-8 max-sm:pt-10">
          <h1 className="m-0 text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">
            {formTitle}
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-tc-brand-body">{formDescription}</p>
          {children}
          {footer}
        </section>
      </div>
    </main>
  )
}

export const authFieldClassName = 'grid gap-1.5'
export const authLabelClassName = 'text-sm font-medium leading-5 text-tc-brand-ink'
export const authInputClassName =
  'h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint disabled:cursor-not-allowed disabled:opacity-50'
export const authPasswordToggleClassName =
  'absolute right-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-0 text-tc-brand-muted transition hover:text-tc-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-tc-brand-deep'
export const authPrimaryButtonClassName =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border-0 bg-tc-brand-deep px-5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-tc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-brand-deep disabled:cursor-not-allowed disabled:opacity-50'
export const authInlineMetaClassName =
  'text-sm leading-5 text-tc-brand-ink'
export const authFooterCopyClassName = 'mt-4 text-center text-sm leading-5 text-tc-brand-body'
export const authFooterLinkClassName =
  'font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black'
export const authLoadingSpinnerClassName =
  'inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-2 border-white/25 border-t-white'
