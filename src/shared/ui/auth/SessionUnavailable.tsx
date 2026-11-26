import { useAuthSession } from '@/shared/context/useAuthSession'
import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

export function SessionUnavailable() {
  const { retrySession } = useAuthSession()
  return <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
    <h1 className="text-2xl font-bold">We couldn't check your sign-in</h1>
    <p>Please check your connection and try again.</p>
    <Button type="button" onClick={() => void retrySession()}>Try again</Button>
    <Link to="/login" className="underline">Sign in instead</Link>
  </main>
}
