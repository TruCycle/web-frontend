import { useMemo, useState } from 'react'
import { Edit2 } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { updateCurrentUserProfile } from '@/features/settings/api/settingsApi'
import { useToast } from '@/shared/ui/toast/useToast'
import { ChangePasswordModal } from '@/features/settings/ui/components/ChangePasswordModal'

type TabKey = 'profile' | 'security' | 'notifications'

function Toggle({
  checked,
  onChange,
}: {
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={classNames(
        'relative inline-flex h-7 w-12 items-center rounded-full transition',
        checked ? 'bg-[#34DA45]' : 'bg-[#00537A0D]',
      )}
      aria-pressed={checked}
    >
      <span
        className={classNames(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    fullName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    phone: '',
    postcode: user?.postcode ?? '',
  })

  const splitName = useMemo(() => {
    const trimmedName = profileForm.fullName.trim()
    if (!trimmedName) {
      return { firstName: '', lastName: '' }
    }

    const [firstName, ...remaining] = trimmedName.split(/\s+/)
    return {
      firstName,
      lastName: remaining.join(' '),
    }
  }, [profileForm.fullName])

  const handleProfileUpdate = async () => {
    if (!splitName.firstName || !splitName.lastName) {
      error('Invalid name', 'Please enter your first and last name.')
      return
    }

    try {
      setIsSaving(true)
      await updateCurrentUserProfile({
        firstName: splitName.firstName,
        lastName: splitName.lastName,
        phone: profileForm.phone,
        postcode: profileForm.postcode,
      })
      success('Profile updated', 'Your profile changes were saved.')
    } catch {
      error('Update failed', 'Unable to update your profile right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your profile, security and preferences.</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl bg-[#E2E8F040] p-2 w-fit">
        {(['profile', 'security', 'notifications'] as const).map((tab) => (
          <button
            key={tab}
            className={classNames(
              'rounded-md px-4 py-3 text-sm font-medium capitalize transition',
              activeTab === tab
                ? 'bg-white text-slate-900'
                : 'text-[#22222299] hover:bg-slate-100 hover:text-slate-800',
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {activeTab === 'profile' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Your Profile</h2>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                type="text"
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((currentForm) => ({
                    ...currentForm,
                    fullName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Phone (optional)</span>
              <input
                className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                type="tel"
                placeholder="Enter your phone number"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((currentForm) => ({
                    ...currentForm,
                    phone: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="h-11 w-full cursor-not-allowed rounded-md border border-[#E2E8F0] bg-slate-100 px-3 text-sm text-slate-500"
                type="email"
                value={user?.email ?? ''}
                disabled
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Postcode</span>
              <input
                className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                type="text"
                value={profileForm.postcode}
                onChange={(event) =>
                  setProfileForm((currentForm) => ({
                    ...currentForm,
                    postcode: event.target.value,
                  }))
                }
              />
            </label>

            <Button variant='primary' disabled={isSaving} className="mt-2" onClick={() => void handleProfileUpdate()}>
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        ) : null}

        {activeTab === 'security' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Security</h2>

            <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] p-4">
              <div className='flex flex-col gap-2'>
                <h3 className="font-medium text-slate-900">Password</h3>
                <p className="text-sm text-[#22222299]">Update your password</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setIsChangePasswordModalOpen(true)}
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] p-4">
              <div className='flex flex-col gap-2'>
                <h3 className="font-medium text-slate-900">2FA</h3>
                <p className="text-sm text-[#22222299]">
                  Enable or disable two-factor authentication
                </p>
              </div>
              <Toggle checked={is2FAEnabled} onChange={setIs2FAEnabled} />
            </div>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>

            <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] p-4">
              <div className='flex flex-col gap-2'>
                <h3 className="font-medium text-slate-900">Email Notifications</h3>
                <p className="text-sm text-[#22222299]">
                  Receive email notifications when updates happen
                </p>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] p-4">
              <div className='flex flex-col gap-2'>
                <h3 className="font-medium text-slate-900">In-App Notifications</h3>
                <p className="text-sm text-[#22222299]">
                  Receive notifications in the dashboard
                </p>
              </div>
              <Toggle checked={inAppNotifications} onChange={setInAppNotifications} />
            </div>
          </div>
        ) : null}
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        email={user?.email ?? ''}
      />
    </div>
  )
}
