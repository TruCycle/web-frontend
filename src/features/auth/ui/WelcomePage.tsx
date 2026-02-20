import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserRole } from '@/shared/context/UserRoleContext'
import { OnboardingChoiceDialog } from './OnboardingChoiceDialog'
import SignupPage from './SignupPage'
import './WelcomePage.css'

export default function WelcomePage() {
  const [isOpen, setIsOpen] = useState(true)
  const { setRole } = useUserRole()
  const navigate = useNavigate()

  const handleSelect = (choice: 'collect' | 'donate') => {
    setRole(choice === 'collect' ? 'collector' : 'donor')
    setIsOpen(false)
    navigate('/dashboard')
  }

  const handleClose = () => {
    setIsOpen(false)
    navigate('/dashboard')
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
      />
    </main>
  )
}
