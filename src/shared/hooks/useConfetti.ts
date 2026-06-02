import confetti from 'canvas-confetti'

export function useConfetti() {
  const fireMilestone = () => {
    void confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0D3B24', '#A4F5A6', '#D4A84B', '#FFFFFF'],
    })
  }

  return { fireMilestone }
}
