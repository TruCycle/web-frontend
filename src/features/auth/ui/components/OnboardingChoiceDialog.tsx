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
      overlayClassName="bg-tc-brand-ink/55"
      containerClassName="max-w-[560px] rounded-tc-xl shadow-tc-dialog"
      hideCloseButton
    >
      <div className="flex flex-col items-center gap-2 p-6 text-center sm:p-8">
        <div className="mb-2" aria-hidden>
          <img
            alt=""
            className="h-24 w-24 object-contain"
            src={onboardingConfettiSrc}
          />
        </div>

        <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">
          What do you want to try first?
        </h2>
        <p className="text-sm leading-5 text-tc-brand-body">
          Start your TruCycle journey by collecting or donating
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-2.5 max-sm:grid-cols-1">
          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft px-4 py-6 text-center transition hover:border-tc-brand-deep focus-visible:border-tc-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tc-brand-mint disabled:cursor-not-allowed disabled:opacity-50',
              isLoading && loadingChoice === 'collect' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('collect')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'collect')}
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-tc-brand-deep">
              <Package size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-tc-brand-ink">
              Collect an item
              {isLoading && loadingChoice === 'collect' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-tc-brand-track border-t-tc-brand-deep"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm leading-5 text-tc-brand-body">
              Browse and claim quality items from the community
            </p>
            <span className="rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold leading-4 text-white">
              Recommended for first time
            </span>
          </button>

          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-tc-lg border border-tc-brand-control bg-white px-4 py-6 text-center transition hover:border-tc-brand-deep focus-visible:border-tc-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tc-brand-mint disabled:cursor-not-allowed disabled:opacity-50',
              isLoading && loadingChoice === 'donate' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('donate')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'donate')}
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
              <Gift size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-tc-brand-ink">
              Donate an item
              {isLoading && loadingChoice === 'donate' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-tc-brand-track border-t-tc-brand-deep"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm leading-5 text-tc-brand-body">
              List items you no longer need and help others
            </p>
            <span className="rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-body">
              Make an impact
            </span>
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-5 text-tc-brand-muted">
          You can always do both -- switch between collecting and donating anytime in your settings.
        </p>
      </div>
    </Modal>
  )
}
