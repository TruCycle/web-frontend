import { useMemo, useState } from 'react'
import { Edit2 } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { updateCurrentUserProfile } from '@/features/settings/api/settingsApi'
import { useToast } from '@/shared/ui/toast/useToast'
import { ChangePasswordModal } from '@/features/settings/ui/components/ChangePasswordModal'
import { ProfileBadges } from '@/features/gamification/ui/ProfileBadges'

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
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tc-brand-mint focus-visible:ring-offset-2',
        checked ? 'bg-tc-brand-deep' : 'bg-tc-brand-track',
      )}
      aria-pressed={checked}
    >
      <span
        className={classNames(
          'inline-block h-5 w-5 transform rounded-full transition',
          checked ? 'translate-x-6 bg-tc-brand-mint' : 'translate-x-1 bg-white',
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
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Settings</h1>
        <p className="mt-1 text-base leading-6 text-tc-brand-body">Manage your profile, security and preferences.</p>
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-full border border-tc-brand-line bg-white p-1">
        {(['profile', 'security', 'notifications'] as const).map((tab) => (
          <button
            key={tab}
            className={classNames(
              'min-h-11 rounded-full px-4 text-[13px] capitalize transition',
              activeTab === tab
                ? 'bg-tc-brand-mint font-semibold text-tc-brand-onMint'
                : 'font-medium text-tc-brand-body hover:bg-tc-brand-soft hover:text-tc-brand-ink',
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5 sm:p-6">
        {activeTab === 'profile' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink md:col-span-2">Your Profile</h2>

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-tc-brand-ink">Full Name</span>
              <input
                className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
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

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-tc-brand-ink">Phone (optional)</span>
              <input
                className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
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

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-tc-brand-ink">Email</span>
              <input
                className="min-h-11 w-full cursor-not-allowed rounded-tc-md border border-tc-brand-control bg-tc-brand-soft px-3.5 text-sm text-tc-brand-ink"
                type="email"
                value={user?.email ?? ''}
                disabled
              />
            </label>

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-tc-brand-ink">Postcode</span>
              <input
                className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
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

            <Button variant='primary' disabled={isSaving} className="mt-1 justify-self-start md:col-span-2" onClick={() => void handleProfileUpdate()}>
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        ) : null}

        {activeTab === 'security' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">Security</h2>

            <div className="flex items-center justify-between gap-4 rounded-tc-md border border-tc-brand-line p-4">
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h3 className="text-sm font-semibold text-tc-brand-ink">Password</h3>
                <p className="text-[13px] leading-5 text-tc-brand-body">Update your password</p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-tc-brand-control bg-white text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsChangePasswordModalOpen(true)}
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-tc-md border border-tc-brand-line p-4">
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h3 className="text-sm font-semibold text-tc-brand-ink">2FA</h3>
                <p className="text-[13px] leading-5 text-tc-brand-body">
                  Enable or disable two-factor authentication
                </p>
              </div>
              <Toggle checked={is2FAEnabled} onChange={setIs2FAEnabled} />
            </div>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">Notifications</h2>

            <div className="flex items-center justify-between gap-4 rounded-tc-md border border-tc-brand-line p-4">
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h3 className="text-sm font-semibold text-tc-brand-ink">Email Notifications</h3>
                <p className="text-[13px] leading-5 text-tc-brand-body">
                  Receive email notifications when updates happen
                </p>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-tc-md border border-tc-brand-line p-4">
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h3 className="text-sm font-semibold text-tc-brand-ink">In-App Notifications</h3>
                <p className="text-[13px] leading-5 text-tc-brand-body">
                  Receive notifications in the dashboard
                </p>
              </div>
              <Toggle checked={inAppNotifications} onChange={setInAppNotifications} />
            </div>
          </div>
        ) : null}
      </div>

      {activeTab === 'profile' ? <ProfileBadges limit={4} /> : null}

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        email={user?.email ?? ''}
      />
    </div>
  )
}
