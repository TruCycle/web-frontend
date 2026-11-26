import { useCallback, useMemo, useSyncExternalStore } from 'react'

function getMediaQuery(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  return window.matchMedia(query)
}

export function useMediaQuery(query: string): boolean {
  const mediaQuery = useMemo(() => getMediaQuery(query), [query])
  const subscribe = useCallback((onChange: () => void) => {
    mediaQuery?.addEventListener('change', onChange)
    return () => mediaQuery?.removeEventListener('change', onChange)
  }, [mediaQuery])
  const getSnapshot = useCallback(() => mediaQuery?.matches ?? false, [mediaQuery])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
