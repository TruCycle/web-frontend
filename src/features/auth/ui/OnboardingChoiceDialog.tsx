import { Check, HandHeart, Package } from 'lucide-react'
import { Modal } from '@/shared/ui/modal/Modal'
import './OnboardingChoiceDialog.css'

interface OnboardingChoiceDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onSelect: (choice: 'collect' | 'donate') => void
}

export function OnboardingChoiceDialog({
  isOpen,
  onClose,
  onSelect,
}: OnboardingChoiceDialogProps) {
  const handleSelect = (choice: 'collect' | 'donate') => {
    onSelect(choice)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="onboarding-modal"
    >
      <div className="onboarding-dialog">
        <div className="onboarding-icon-wrap" aria-hidden>
          <div className="onboarding-icon">
            <Check size={22} />
          </div>
        </div>

        <h2 className="onboarding-title">What do you want to try first?</h2>
        <p className="onboarding-subtitle">
          Start your TruCycle journey by collecting or donating
        </p>

        <div className="onboarding-options">
          <button
            className="onboarding-option onboarding-option-recommended"
            type="button"
            onClick={() => handleSelect('collect')}
          >
            <div className="onboarding-option-icon collect">
              <Package size={20} />
            </div>
            <h3>Collect an item</h3>
            <p>Browse and claim quality items from the community</p>
            <span className="onboarding-pill">Recommended for first time</span>
          </button>

          <button
            className="onboarding-option"
            type="button"
            onClick={() => handleSelect('donate')}
          >
            <div className="onboarding-option-icon donate">
              <HandHeart size={20} />
            </div>
            <h3>Donate an item</h3>
            <p>List items you no longer need and help others</p>
            <span className="onboarding-link">Make an impact</span>
          </button>
        </div>

        <p className="onboarding-footnote">
          You can always do both -- switch between collecting and donating anytime
          in your settings.
        </p>
      </div>
    </Modal>
  )
}
