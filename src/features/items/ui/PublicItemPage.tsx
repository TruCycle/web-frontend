import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createItemClaim, fetchPublicItem } from '@/features/items/api/itemsApi'
import type { BrowseItem } from '@/features/items/types'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { ApiError } from '@/shared/types/network'

type Result = { id: string; item?: BrowseItem; failure?: 'missing' | 'unavailable' }

/** Email/bookmarked item links work without location permission or sign-in. */
export default function PublicItemPage() {
  const { id = '' } = useParams()
  const { user, isAuthenticated, isBootstrapping, isSessionUnavailable } = useAuthSession()
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [claim, setClaim] = useState<{ id: string; userId: string; phase: 'pending' | 'sent' | 'failed' } | null>(null)
  const sending = useRef(false)
  usePageMeta({ title: 'Item details — TruCycle', description: 'View this TruCycle listing and its availability.', noIndex: true })
  useEffect(() => {
    let active = true
    void fetchPublicItem(id).then(item => { if (active) setResult({ id, item }) }).catch((error: unknown) => {
      if (active) setResult({ id, failure: error instanceof ApiError && [400, 404, 410].includes(error.statusCode) ? 'missing' : 'unavailable' })
    })
    return () => { active = false }
  }, [id, attempt])
  const current = result?.id === id ? result : null
  const item = current?.item
  const currentClaim = claim?.id === id && claim.userId === user?.id ? claim : null
  async function requestItem() {
    if (!item || !user || !isAuthenticated || sending.current || currentClaim?.phase === 'sent') return
    const userId = user.id
    sending.current = true
    setClaim({ id, userId, phase: 'pending' })
    try { await createItemClaim(id); setClaim({ id, userId, phase: 'sent' }) }
    catch { setClaim({ id, userId, phase: 'failed' }) }
    finally { sending.current = false }
  }
  const claimable = item && ['active', 'awaiting_collection'].includes(item.status)
  const actionClass = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-950 px-4 py-2 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50'
  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 text-slate-900">
    <nav aria-label="Item navigation" className="flex flex-wrap gap-6"><Link to="/" className="font-bold">TruCycle</Link><Link to="/browse" className="underline">Browse items</Link></nav>
    {!current ? <p role="status">Loading item…</p> : current.failure ? <section className="space-y-4">
      <h1 className="text-2xl font-bold">{current.failure === 'missing' ? 'Item unavailable' : 'Unable to load this item'}</h1>
      <p>{current.failure === 'missing' ? 'This listing may have been removed or is no longer public.' : 'Please try again. Your account has not been changed.'}</p>
      {current.failure === 'unavailable' && <button className={actionClass} onClick={() => { setResult(null); setAttempt(value => value + 1) }}>Try again</button>}
      <Link to="/browse" className="block underline">Browse available items</Link>
    </section> : item ? <article className="space-y-5">
      <h1 className="break-words text-3xl font-bold">{item.title}</h1>
      {item.image && <img src={item.image.url} alt={item.image.altText ?? item.title} className="max-h-96 w-full rounded-xl object-contain" />}
      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4">
        <dt>Category</dt><dd className="break-words">{item.category}</dd>
        <dt>Condition</dt><dd className="break-words">{item.condition.replaceAll('_', ' ')}</dd>
        <dt>Approximate area</dt><dd>{item.locationLabel}</dd>
        <dt>Status</dt><dd>{item.status.replaceAll('_', ' ')}</dd>
      </dl>
      <p className="text-sm text-slate-600">The public listing shows an approximate area. Confirm handoff details with the owner after your request is accepted.</p>
      {!claimable ? <p role="status">This item is not currently available to request.</p>
        : isBootstrapping ? <p role="status">Checking session…</p>
        : isSessionUnavailable ? <p role="status">Account access is temporarily unavailable. You can still browse this listing.</p>
        : !isAuthenticated ? <Link to="/login" state={{ from: { pathname: `/items/${id}` } }} className={actionClass}>Sign in to request this item</Link>
        : <div className="space-y-3">
          <button className={actionClass} disabled={claim?.phase === 'pending' || currentClaim?.phase === 'sent'} onClick={() => void requestItem()}>{currentClaim?.phase === 'sent' ? 'Request sent' : currentClaim?.phase === 'pending' ? 'Sending request…' : 'Request this item'}</button>
          {currentClaim?.phase === 'sent' && <p role="status">Your request has been sent to the owner. <Link to="/collected" className="underline">View your requests</Link></p>}
          {currentClaim?.phase === 'failed' && <p role="alert">We could not confirm this request. Check your requests before trying again.</p>}
        </div>}
    </article> : null}
  </main>
}
