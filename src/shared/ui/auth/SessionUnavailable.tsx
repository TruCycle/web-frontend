import { useAuthSession } from '@/shared/context/useAuthSession'
import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

export function SessionUnavailable() {
  const { retrySession } = useAuthSession()
  return <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-3 px-6 text-center text-tc-brand-body">
    <h1 className="mb-0 text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">We couldn't check your sign-in</h1>
    <p>Please check your connection and try again.</p>
    <Button type="button" onClick={() => void retrySession()}>Try again</Button>
    <Link to="/login" className="inline-flex min-h-11 items-center font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black">Sign in instead</Link>
  </main>
}
