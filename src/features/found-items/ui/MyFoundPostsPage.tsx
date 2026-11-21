import { useState } from 'react'
import { FoundItemDetailsPanel } from './components/FoundItemDetailsPanel'
import { useFoundItemDetails } from '../hooks/useFoundItemDetails'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button/Button'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useToast } from '@/shared/ui/toast/useToast'
import { useMyFoundPosts } from '../hooks/useMyFoundPosts'
import { FoundItemStatusBadge } from './components/FoundItemStatusBadge'

export default function MyFoundPostsPage() {
  const { user } = useAuthSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const details = useFoundItemDetails(selectedId, user?.id)
  const { success, error } = useToast()
  const {
    items,
    isLoading,
    error: pageError,
    updateStatus,
    remove,
    refresh,
    pagination,
    loadMore,
  } = useMyFoundPosts(user?.id)

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink">My Found Posts</h1>
          <p className="text-base leading-6 text-tc-brand-body">Manage what you have shared.</p>
        </div>
        <Link
          to="/found-items?compose=1"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover"
        >
          Post Item
        </Link>
      </div>

      {pageError ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{pageError}</p> : null}
      {isLoading ? <p className="rounded-tc-lg border border-tc-brand-line bg-white p-6 text-sm text-tc-brand-body">Loading posts...</p> : null}

      {!isLoading && items.length === 0 ? (
        <p className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-sm text-tc-brand-body">No posts yet.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white">
            <div className="relative">
              {item.images[0] ? (
                <img
                  src={item.images[0].thumbnailUrl || item.images[0].url}
                  alt={item.title}
                  className="block h-[196px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[196px] items-center justify-center bg-tc-brand-soft text-sm text-tc-brand-muted">
                  No image
                </div>
              )}
              <span className="absolute left-3 top-3 inline-flex">
                <FoundItemStatusBadge status={item.status} />
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-base leading-6 font-semibold text-tc-brand-ink"><button type="button" className="break-words text-left underline decoration-tc-brand-control underline-offset-4 hover:decoration-tc-brand-deep" onClick={() => setSelectedId(item.id)}>{item.title}</button></h2>
                <p className="text-[13px] leading-5 text-tc-brand-muted">{item.location.postcode}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] leading-5 tabular-nums text-tc-brand-muted">
              <span>{item.claimCount} interested</span>
              <span>{item.viewCount} views</span>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2">
              {item.status === 'available' || item.status === 'claimed' ? (
                <Button
                  variant="primary"
                  className="basis-full justify-center"
                  onClick={() => {
                    void updateStatus(item.id, 'picked_up')
                      .then(() => success('Updated', 'Marked as picked up.'))
                      .catch(() => error('Update failed', 'Please try again in a moment.'))
                  }}
                >
                  Mark Picked Up
                </Button>
              ) : item.status === 'expired' || item.status === 'gone' ? (
                <Button
                  variant="primary"
                  className="basis-full justify-center"
                  onClick={() => {
                    void updateStatus(item.id, 'available')
                      .then(() => success('Updated', 'Item is live again.'))
                      .catch(() => error('Update failed', 'Please try again in a moment.'))
                  }}
                >
                  Reconfirm Available
                </Button>
              ) : null}
              {item.status === 'available' || item.status === 'claimed' ? (
                <Button variant="secondary" className="flex-auto shrink-0 justify-center whitespace-nowrap" onClick={() => {
                  void updateStatus(item.id, 'gone')
                    .then(() => success('Closed', 'Post closed without recording a pickup.'))
                    .catch(() => error('Update failed', 'Please try again in a moment.'))
                }}>Mark Gone (no pickup)</Button>
              ) : null}
              <Button
                variant="danger"
                className="shrink-0 justify-center whitespace-nowrap"
                onClick={() => {
                  void remove(item.id)
                    .then(() => success('Removed', 'Post deleted.'))
                    .catch(() => error('Delete failed', 'Close any active pickup requests before deleting this post.'))
                }}
              >
                Delete Post
              </Button>
            </div>
            </div>
          </article>
        ))}
      </div>
      {details.error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{details.error}</p> : null}
      {pagination && pagination.page < pagination.totalPages ? <Button variant="secondary" className="self-center" disabled={isLoading} onClick={() => { void loadMore() }}>Load more posts</Button> : null}
      <FoundItemDetailsPanel onLifecycleChange={() => { void Promise.all([refresh(), details.refresh()]) }} isOpen={selectedId !== null} onClose={() => setSelectedId(null)} item={details.item} claims={details.claims} currentUserId={user?.id} isLoading={details.isLoading} />
    </div>
  )
}
