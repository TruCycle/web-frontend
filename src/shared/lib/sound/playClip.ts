// Lightweight Web Audio sound clip player.
//
// Plays short audio clips (typically <100kb mp3 / wav) while respecting:
//   - a per-user mute toggle stored in localStorage
//   - browsers that gate audio behind a user gesture (it just no-ops then)
//
// Place clip files under `/public/sounds/` so they are served at root.

const MUTE_STORAGE_KEY = 'tc.muteSounds'

const audioCache = new Map<string, HTMLAudioElement>()

function isMuted(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function isSoundMuted(): boolean {
  return isMuted()
}

/**
 * Play a short clip from `/public/sounds/`. Safe to call from anywhere — it
 * silently fails if the user has muted, the file is missing, or the browser
 * blocks autoplay.
 */
export function playClip(src: string, volume = 0.6): void {
  if (typeof window === 'undefined') return
  if (isMuted()) return

  let audio = audioCache.get(src)
  if (!audio) {
    audio = new Audio(src)
    audio.preload = 'auto'
    audioCache.set(src, audio)
  }

  try {
    audio.currentTime = 0
    audio.volume = Math.min(1, Math.max(0, volume))
    void audio.play().catch(() => {
      // Autoplay blocked or file missing — never throw to callers.
    })
  } catch {
    // Ignore.
  }
}
