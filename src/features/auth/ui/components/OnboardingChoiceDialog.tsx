import { Gift, Package } from 'lucide-react'
import onboardingConfettiSrc from '@/assets/icons/onbaord-confetti.svg'
import { Modal } from '@/shared/ui/modal/Modal'
import { classNames } from '@/shared/utils/classNames'

interface OnboardingChoiceDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onSelect: (choice: 'collect' | 'donate') => void
  readonly isLoading?: boolean
  readonly loadingChoice?: 'collect' | 'donate' | null
}

export function OnboardingChoiceDialog({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
  loadingChoice = null,
}: OnboardingChoiceDialogProps) {
  const handleSelect = (choice: 'collect' | 'donate') => {
    onSelect(choice)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      overlayClassName="bg-tc-brand-ink/60 backdrop-blur-[16px]"
      containerClassName="max-w-[700px]"
      hideCloseButton
    >
      <div className="flex flex-col items-center gap-3 px-20 py-12 text-center">
        <div className="mb-2" aria-hidden>
          <img
            alt=""
            className="h-[9.5rem] w-[9.5rem] object-contain"
            src={onboardingConfettiSrc}
          />
        </div>

        <h2 className="text-xl font-semibold text-tc-brand-ink">
          What do you want to try first?
        </h2>
        <p className="text-sm text-tc-brand-muted">
          Start your TruCycle journey by collecting or donating
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-4 max-sm:grid-cols-1">
          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-tc-brand-haze px-5 py-8 text-center transition hover:border-tc-brand-link focus-visible:border-tc-brand-link focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70',
              isLoading && loadingChoice === 'collect' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('collect')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'collect')}
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mint/25 text-tc-brand-link">
              <Package size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-tc-brand-ink">
              Collect an item
              {isLoading && loadingChoice === 'collect' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-lime-600"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm text-tc-brand-muted">
              Browse and claim quality items from the community
            </p>
            <span className="rounded-full border border-tc-brand-mint px-3 py-1 text-xs text-tc-brand-link bg-tc-brand-haze">
              Recommended for first time
            </span>
          </button>

          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-tc-brand-haze px-5 py-8 text-center transition hover:border-tc-brand-link focus-visible:border-tc-brand-link focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70',
              isLoading && loadingChoice === 'donate' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('donate')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'donate')}
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mint/25 text-tc-brand-link">
              <Gift size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-tc-brand-ink">
              Donate an item
              {isLoading && loadingChoice === 'donate' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-lime-600"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm text-tc-brand-muted">
              List items you no longer need and help others
            </p>
            <span className="rounded-full border border-tc-brand-line px-3 py-1 text-xs text-tc-brand-ink bg-tc-brand-haze">
              Make an impact
            </span>
          </button>
        </div>

        <p className="text-sm text-tc-brand-ink">
          You can always do both -- switch between collecting and donating anytime in your settings.
        </p>
      </div>
    </Modal>
  )
}
