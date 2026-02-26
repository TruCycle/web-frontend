import { Eye, EyeOff } from 'lucide-react'

interface PasswordVisibilityIconProps {
  readonly isVisible: boolean
}

export function PasswordVisibilityIcon({ isVisible }: PasswordVisibilityIconProps) {
  const Icon = isVisible ? Eye : EyeOff
  return <Icon aria-hidden className="pointer-events-none" size={18} strokeWidth={1.8} />
}
