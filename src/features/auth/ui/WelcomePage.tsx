import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserRole } from '@/shared/context/UserRoleContext'
import { OnboardingChoiceDialog } from './OnboardingChoiceDialog'
import SignupPage from './SignupPage'
import './WelcomePage.css'

export default function WelcomePage() {
  const [isOpen, setIsOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<
    'collect' | 'donate' | null
  >(null)
  const { setRole } = useUserRole()
  const navigate = useNavigate()

  const handleSelect = (choice: 'collect' | 'donate') => {
    if (isSubmitting) {
      return
    }
    setIsSubmitting(true)
    setPendingChoice(choice)
    setRole(choice === 'collect' ? 'collector' : 'donor')
    setIsOpen(false)
    navigate('/login')
  }

  const handleClose = () => {
    setIsOpen(false)
    navigate('/login')
  }

  return (
    <main className="welcome-page">
      <div className="welcome-backdrop" aria-hidden>
        <SignupPage className="welcome-blur" showOnboarding={false} />
      </div>

      <OnboardingChoiceDialog
        isOpen={isOpen}
        onClose={handleClose}
        onSelect={handleSelect}
        isLoading={isSubmitting}
        loadingChoice={pendingChoice}
      />
    </main>
  )
}
