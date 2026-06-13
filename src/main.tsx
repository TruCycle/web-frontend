import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/shared/styles/global.css'
import { PostHogProvider } from '@posthog/react'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN} options={options}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
