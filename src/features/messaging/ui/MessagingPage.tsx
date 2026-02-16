import { useMessages } from '@/features/messaging/hooks/useMessages'

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString()
}

export default function MessagingPage() {
  const { messages, isLoading, error } = useMessages()

  if (isLoading) {
    return <p className="page-status">Loading messages...</p>
  }

  return (
    <section className="page-card">
      <h1>Messaging</h1>
      <p>Feature scaffold with API layer + hook + shared websocket wrapper.</p>
      {error ? <p className="page-status-error">{error}</p> : null}
      {messages.length === 0 ? (
        <p className="page-status">No messages yet.</p>
      ) : (
        <ul className="list-reset stack-gap-sm">
          {messages.map((message) => (
            <li className="surface-row" key={message.id}>
              <p className="row-title">{message.author}</p>
              <p className="row-body">{message.body}</p>
              <p className="row-meta">{formatDate(message.sentAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
