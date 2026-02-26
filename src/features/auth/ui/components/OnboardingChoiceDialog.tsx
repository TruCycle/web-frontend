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
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-[#22222299] backdrop-blur-[16px]"
      containerClassName="max-w-[700px]"
    >
      <div className="flex flex-col items-center gap-3 px-20 py-12 text-center">
        <div className="mb-2" aria-hidden>
          <img
            alt=""
            className="h-[9.5rem] w-[9.5rem] object-contain"
            src={onboardingConfettiSrc}
          />
        </div>

        <h2 className="text-xl font-semibold text-[#121212]">
          What do you want to try first?
        </h2>
        <p className="text-sm text-[#12121299]">
          Start your TruCycle journey by collecting or donating
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-4 max-sm:grid-cols-1">
          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-2xl bg-[#A4F5A61A] px-5 py-8 text-center transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70',
              isLoading && loadingChoice === 'collect' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('collect')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'collect')}
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#A4F5A640] text-[#15A119]">
              <Package size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-[#121212]">
              Collect an item
              {isLoading && loadingChoice === 'collect' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-lime-600"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm text-[#12121299]">
              Browse and claim quality items from the community
            </p>
            <span className="rounded-full border border-[#A4F5A6] px-3 py-1 text-xs text-[#15A119]/80 bg-[#A4F5A61A]">
              Recommended for first time
            </span>
          </button>

          <button
            className={classNames(
              'flex flex-col items-center gap-2 rounded-2xl bg-[#A4F5A61A] px-5 py-8 text-center transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70',
              isLoading && loadingChoice === 'donate' && 'cursor-wait',
            )}
            type="button"
            onClick={() => handleSelect('donate')}
            disabled={isLoading}
            aria-busy={Boolean(isLoading && loadingChoice === 'donate')}
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#A4F5A640] text-[#15A119]">
              <Gift size={20} />
            </div>
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-[#121212]">
              Donate an item
              {isLoading && loadingChoice === 'donate' ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-lime-600"
                  aria-hidden
                />
              ) : null}
            </h3>
            <p className="text-sm text-[#12121299]">
              List items you no longer need and help others
            </p>
            <span className="rounded-full border border-[#E2E8F0] px-3 py-1 text-xs text-[#222222] bg-[#F8FAFC]">
              Make an impact
            </span>
          </button>
        </div>

        <p className="text-sm text-[#222222]">
          You can always do both -- switch between collecting and donating anytime in your settings.
        </p>
      </div>
    </Modal>
  )
}
