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
    const request = new AbortController()
    void fetchPublicItem(id, request.signal).then(item => { if (active) setResult({ id, item }) }).catch((error: unknown) => {
      if (active) setResult({ id, failure: error instanceof ApiError && [400, 404, 410].includes(error.statusCode) ? 'missing' : 'unavailable' })
    })
    return () => { active = false; request.abort() }
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
  const actionClass = 'inline-flex min-h-11 items-center justify-center rounded-full bg-tc-brand-deep px-5 py-2 text-sm font-semibold text-white transition hover:bg-tc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-brand-deep disabled:cursor-not-allowed disabled:opacity-50'
  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 text-sm leading-5 text-tc-brand-ink sm:py-12">
    <nav aria-label="Item navigation" className="flex flex-wrap items-center gap-6"><Link to="/" className="inline-flex min-h-11 items-center text-lg font-semibold text-tc-brand-ink no-underline">TruCycle</Link><Link to="/browse" className="inline-flex min-h-11 items-center font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black">Browse items</Link></nav>
    {!current ? <p role="status">Loading item…</p> : current.failure ? <section className="space-y-3 rounded-tc-lg border border-tc-brand-line bg-white px-6 py-12 text-center text-tc-brand-body">
      <h1 className="text-lg font-semibold leading-7 text-tc-brand-ink">{current.failure === 'missing' ? 'Item unavailable' : 'Unable to load this item'}</h1>
      <p>{current.failure === 'missing' ? 'This listing may have been removed or is no longer public.' : 'Please try again. Your account has not been changed.'}</p>
      {current.failure === 'unavailable' && <button className={actionClass} onClick={() => { setResult(null); setAttempt(value => value + 1) }}>Try again</button>}
      <Link to="/browse" className="mx-auto flex min-h-11 w-fit items-center justify-center rounded-full border border-tc-brand-control bg-white px-5 text-sm font-semibold text-tc-brand-ink no-underline transition hover:bg-tc-brand-soft">Browse available items</Link>
    </section> : item ? <article className="space-y-5">
      <h1 className="break-words text-4xl font-semibold tracking-[-0.03em] text-tc-brand-ink sm:text-5xl sm:leading-[54px]">{item.title}</h1>
      {item.image && <img src={item.image.url} alt={item.image.altText ?? item.title} className="max-h-96 w-full rounded-tc-xl bg-tc-brand-soft object-contain" />}
      <dl className="grid grid-cols-2 items-center gap-x-4 gap-y-3 rounded-tc-md border border-tc-brand-line bg-white p-4 [&>dd]:font-semibold [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:uppercase [&>dt]:tracking-[0.04em] [&>dt]:text-tc-brand-muted">
        <dt>Category</dt><dd className="break-words">{item.category}</dd>
        <dt>Condition</dt><dd className="break-words">{item.condition.replaceAll('_', ' ')}</dd>
        <dt>Approximate area</dt><dd>{item.locationLabel}</dd>
        <dt>Status</dt><dd>{item.status.replaceAll('_', ' ')}</dd>
      </dl>
      <p className="rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft px-4 py-3.5 text-sm text-tc-brand-ink">The public listing shows an approximate area. Confirm handoff details with the owner after your request is accepted.</p>
      {!claimable ? <p role="status">This item is not currently available to request.</p>
        : isBootstrapping ? <p role="status">Checking session…</p>
        : isSessionUnavailable ? <p role="status">Account access is temporarily unavailable. You can still browse this listing.</p>
        : !isAuthenticated ? <Link to="/login" state={{ from: { pathname: `/items/${id}` } }} className={actionClass}>Sign in to request this item</Link>
        : <div className="space-y-3">
          <button className={actionClass} disabled={claim?.phase === 'pending' || currentClaim?.phase === 'sent'} onClick={() => void requestItem()}>{currentClaim?.phase === 'sent' ? 'Request sent' : currentClaim?.phase === 'pending' ? 'Sending request…' : 'Request this item'}</button>
          {currentClaim?.phase === 'sent' && <p role="status">Your request has been sent to the owner. <Link to="/collected" className="font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black">View your requests</Link></p>}
          {currentClaim?.phase === 'failed' && <p role="alert">We could not confirm this request. Check your requests before trying again.</p>}
        </div>}
    </article> : null}
  </main>
}
