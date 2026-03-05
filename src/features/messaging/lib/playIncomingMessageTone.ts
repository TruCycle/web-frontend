let audioContext: AudioContext | null = null

export function playIncomingMessageTone() {
  const AudioContextConstructor = window.AudioContext
  if (!AudioContextConstructor) {
    return
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor()
  }

  void audioContext.resume().catch(() => undefined)

  const now = audioContext.currentTime
  const firstOscillator = audioContext.createOscillator()
  const secondOscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  firstOscillator.type = 'sine'
  secondOscillator.type = 'triangle'
  firstOscillator.frequency.setValueAtTime(860, now)
  secondOscillator.frequency.setValueAtTime(1280, now + 0.06)

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

  firstOscillator.connect(gainNode)
  secondOscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  firstOscillator.start(now)
  secondOscillator.start(now + 0.06)
  firstOscillator.stop(now + 0.18)
  secondOscillator.stop(now + 0.24)
}
