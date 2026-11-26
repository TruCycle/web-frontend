import { useState } from 'react'
import { acknowledgeFoundItemClaim, observeFoundItem, reconfirmFoundItem } from '../../api/foundItemsApi'
import type { FoundItem, FoundItemClaim } from '../../types'

export function FoundItemLifecycleActions({ item, currentUserId, viewerClaim, claims = [], onChanged }: {
  readonly item: FoundItem
  readonly currentUserId?: string
  readonly viewerClaim?: FoundItemClaim | null
  readonly claims?: FoundItemClaim[]
  readonly onChanged?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const own = currentUserId === item.poster.id
  const active = item.status === 'available' || item.status === 'claimed'
  async function act(operation: () => Promise<void>) {
    setBusy(true); setMessage('')
    try { await operation(); setMessage('Observation saved. Gone signals do not award pickup points.'); onChanged?.() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save. Please retry.') }
    finally { setBusy(false) }
  }
  async function observe(kind: 'still_there' | 'gone') {
    let origin: { latitude: number; longitude: number } | undefined
    if (!own && viewerClaim?.status !== 'acknowledged') {
      origin = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Location is unavailable. You can still send a report.')); return }
        navigator.geolocation.getCurrentPosition(position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => reject(new Error('Location was not shared. You can still send a report.')), { timeout: 10000, maximumAge: 0 })
      })
    }
    await observeFoundItem(item.id, kind, origin)
  }
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Spot availability">
    <p className="text-sm text-slate-600">{item.lastSeenAt ? `Last seen ${new Date(item.lastSeenAt).toLocaleString()}` : 'Last seen not confirmed'}</p>
    <p className="text-xs text-slate-500">{item.expiresAt ? `Expiry: ${new Date(item.expiresAt).toLocaleString()}` : 'No expiry scheduled'}</p>
    {active ? <><p className="text-xs text-slate-500">Nearby observations use your self-reported location. Location is not stored and does not verify physical presence. Gone signals award no pickup points.</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy} className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50" onClick={() => { void act(() => own ? reconfirmFoundItem(item.id) : observe('still_there')) }}>Still there</button>
      <button disabled={busy} className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50" onClick={() => { void act(() => observe('gone')) }}>{viewerClaim ? 'Not there when I arrived' : 'Gone'}</button></div></> : null}
    {own && (item.status === 'gone' || item.status === 'expired') ? <button disabled={busy} className="rounded-xl border px-3 py-2 text-sm" onClick={() => { void act(() => reconfirmFoundItem(item.id)) }}>{item.status === 'gone' ? 'Dispute gone: still available' : 'Reconfirm available'}</button> : null}
    {own ? claims.filter(claim => claim.status === 'pending').map(claim => <button key={claim.id} disabled={busy} className="block rounded-xl border px-3 py-2 text-sm" onClick={() => { void act(() => acknowledgeFoundItemClaim(item.id, claim.id)) }}>Acknowledge pickup request</button>) : null}
    {message ? <p role="status" className="text-sm text-slate-600">{message}</p> : null}
  </section>
}
