import { useCallback, useSyncExternalStore } from 'react'

function getMediaQuery(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  return window.matchMedia(query)
}

const getServerSnapshot = () => false

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mediaQuery = getMediaQuery(query)
    mediaQuery?.addEventListener('change', onChange)
    return () => mediaQuery?.removeEventListener('change', onChange)
  }, [query])
  const getSnapshot = useCallback(() => getMediaQuery(query)?.matches ?? false, [query])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
