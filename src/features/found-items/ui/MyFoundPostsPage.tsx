import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button/Button'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useToast } from '@/shared/ui/toast/useToast'
import { useMyFoundPosts } from '../hooks/useMyFoundPosts'
import { FoundItemStatusBadge } from './components/FoundItemStatusBadge'

export default function MyFoundPostsPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const {
    items,
    isLoading,
    error: pageError,
    updateStatus,
    remove,
  } = useMyFoundPosts(user?.id)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Found Posts</h1>
          <p className="text-slate-500">Manage what you have shared.</p>
        </div>
        <Link
          to="/found-items?compose=1"
          className="inline-flex items-center rounded-xl bg-tc-action-primary px-4 py-3 text-sm font-medium text-tc-action-primaryText transition hover:bg-tc-action-primaryHover"
        >
          Post Item
        </Link>
      </div>

      {pageError ? <p className="text-sm text-rose-600">{pageError}</p> : null}
      {isLoading ? <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">Loading posts...</p> : null}

      {!isLoading && items.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">No posts yet.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
            {item.images[0] ? (
              <img
                src={item.images[0].thumbnailUrl || item.images[0].url}
                alt={item.title}
                className="h-44 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                No image
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.location.postcode}</p>
              </div>
              <FoundItemStatusBadge status={item.status} />
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{item.claimCount} interested</span>
              <span>{item.viewCount} views</span>
            </div>

            <div className="grid gap-2">
              {item.status !== 'picked_up' ? (
                <Button
                  variant="secondary"
                  className="justify-center"
                  onClick={() => {
                    void updateStatus(item.id, 'picked_up')
                      .then(() => success('Updated', 'Marked as picked up.'))
                      .catch(() => error('Update failed', 'Please try again in a moment.'))
                  }}
                >
                  Mark Picked Up
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="justify-center"
                  onClick={() => {
                    void updateStatus(item.id, 'available')
                      .then(() => success('Updated', 'Item is live again.'))
                      .catch(() => error('Update failed', 'Please try again in a moment.'))
                  }}
                >
                  Reopen Post
                </Button>
              )}
              <Button
                variant="danger"
                className="justify-center"
                onClick={() => {
                  void remove(item.id)
                    .then(() => success('Removed', 'Post deleted.'))
                    .catch(() => error('Delete failed', 'Please try again in a moment.'))
                }}
              >
                Delete Post
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
