import type {
  AuthTokens,
  AuthUser,
  LoginPayload,
  PartnerOpeningHoursPayload,
  RegisterPayload,
  RegistrationResult,
  VerificationDeliveryStatus,
  ResetPasswordPayload,
  UpgradeToPartnerPayload,
} from '@/features/auth/types'
import { apiRequest } from '@/shared/lib/api/client'

interface ApiEnvelope<TData> {
  readonly status: string
  readonly message: string
  readonly data: TData
}

interface ApiAuthUser {
  readonly id: string
  readonly email: string
  readonly firstName?: string
  readonly first_name?: string
  readonly lastName?: string
  readonly last_name?: string
  readonly status?: string
  readonly postcode?: string
  readonly roles?: readonly string[]
}

interface AuthDataWithTokens {
  readonly user: ApiAuthUser
  readonly tokens: {
    readonly accessToken: string
    readonly refreshToken?: string
    readonly accessTokenExpiry?: string
    readonly refreshTokenExpiry?: string
  }
}

interface AuthDataWithoutTokens {
  readonly verificationDelivery?: { readonly status?: unknown }
  readonly user: ApiAuthUser
}

function normalizeUser(user: ApiAuthUser): AuthUser {
  if (!user || typeof user.id !== 'string' || !user.id || typeof user.email !== 'string') {
    throw new Error('Invalid sign-in response. Please retry.')
  }
  return {
    id: user.id,
    email: user.email,
    firstName: typeof (user.firstName ?? user.first_name) === 'string' ? (user.firstName ?? user.first_name)! : '',
    lastName: typeof (user.lastName ?? user.last_name) === 'string' ? (user.lastName ?? user.last_name)! : '',
    status: user.status,
    postcode: user.postcode,
    roles: user.roles,
  }
}

function mapTokens(payload: AuthDataWithTokens): AuthTokens {
  if (!payload?.tokens || typeof payload.tokens.accessToken !== 'string' || !payload.tokens.accessToken.trim()) {
    throw new Error('Invalid sign-in response. Please retry.')
  }
  return {
    accessToken: payload.tokens.accessToken,
    refreshToken: payload.tokens.refreshToken,
    accessTokenExpiry: payload.tokens.accessTokenExpiry,
    refreshTokenExpiry: payload.tokens.refreshTokenExpiry,
  }
}

export async function registerUser(payload: RegisterPayload): Promise<RegistrationResult> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithoutTokens>, {
    first_name: string
    last_name: string
    email: string
    password: string
  }>('/auth/register', {
    method: 'POST',
    // Registration includes two independently bounded transactional email attempts.
    timeoutMs: 30_000,
    includeAuth: false,
    body: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
    },
  })

  const rawStatus = response.data.verificationDelivery?.status
  const allowed: readonly unknown[] = ['accepted', 'unavailable', 'rejected', 'timeout', 'failed']
  const status: VerificationDeliveryStatus = allowed.includes(rawStatus) ? rawStatus as VerificationDeliveryStatus : 'unknown'
  return { user: normalizeUser(response.data.user), verificationDelivery: { status } }
}

export async function loginUser(
  payload: LoginPayload,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithTokens>, LoginPayload>(
    '/auth/login',
    {
      method: 'POST',
      includeAuth: false,
      body: payload,
    },
  )

  return {
    user: normalizeUser(response.data.user),
    tokens: mapTokens(response.data),
  }
}

export async function loginWithGoogle(
  idToken: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithTokens>, { id_token: string }>(
    '/auth/google',
    {
      method: 'POST',
      body: { id_token: idToken },
      includeAuth: false,
    },
  )

  return {
    user: normalizeUser(response.data.user),
    tokens: mapTokens(response.data),
  }
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithoutTokens>>('/auth/me', { signal, skipSessionRecovery: true })
  return normalizeUser(response.data.user)
}

export interface SignOutCredential { readonly refreshToken?: string; readonly accessToken?: string }
export async function revokeSession(credential: SignOutCredential): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST', includeAuth: false, skipSessionRecovery: true,
    body: credential.refreshToken ? { refresh_token: credential.refreshToken } : { access_token: credential.accessToken } })
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<ApiEnvelope<null>, { email: string }>('/auth/forget-password', {
    method: 'POST',
    includeAuth: false,
    body: { email },
  })
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await apiRequest<ApiEnvelope<null>, { email: string }>('/auth/resend-verification', {
    method: 'POST',
    timeoutMs: 15_000,
    body: { email },
    includeAuth: false,
  })
}

export async function verifyEmailToken(
  token: string,
): Promise<void> {
  const response = await apiRequest<ApiEnvelope<{ verified: boolean }>, { token: string }>(
    '/auth/verify',
    {
      method: 'POST',
      includeAuth: false,
      skipSessionRecovery: true,
      body: { token },
    },
  )

  if (response.data?.verified !== true) throw new Error('Email verification could not be confirmed')
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest<ApiEnvelope<null>, { email: string; otp: string; new_password: string }>(
    '/auth/reset-password',
    {
      method: 'POST',
      includeAuth: false,
      body: {
        email: payload.email,
        otp: payload.otp,
        new_password: payload.newPassword,
      },
    },
  )
}

interface RefreshData {
  readonly user: ApiAuthUser
  readonly tokens: {
    readonly accessToken: string
    readonly refreshToken?: string
    readonly accessTokenExpiry?: string
    readonly refreshTokenExpiry?: string
  }
}

interface UpgradeToPartnerData {
  readonly user: ApiAuthUser
  readonly tokens?: {
    readonly accessToken: string
    readonly refreshToken?: string
    readonly accessTokenExpiry?: string
    readonly refreshTokenExpiry?: string
  }
}

interface UpgradeToPartnerRequest {
  readonly name: string
  readonly address_line: string
  readonly postcode: string
  readonly phone_number?: string
  readonly latitude?: number
  readonly longitude?: number
  readonly operational_notes?: string
  readonly acceptable_categories?: readonly string[]
  readonly opening_hours?: {
    readonly days: readonly string[]
    readonly open_time: string
    readonly close_time: string
  }
}

function mapOpeningHoursToApi(
  payload?: PartnerOpeningHoursPayload,
): UpgradeToPartnerRequest['opening_hours'] | undefined {
  if (!payload) {
    return undefined
  }

  return {
    days: payload.days,
    open_time: payload.openTime,
    close_time: payload.closeTime,
  }
}

export async function upgradeToPartner(
  payload: UpgradeToPartnerPayload,
): Promise<{ user: AuthUser; tokens?: AuthTokens }> {
  const requestPayload: UpgradeToPartnerRequest = {
    name: payload.name,
    address_line: payload.addressLine,
    postcode: payload.postcode,
    phone_number: payload.phoneNumber,
    latitude: payload.latitude,
    longitude: payload.longitude,
    operational_notes: payload.operationalNotes,
    acceptable_categories: payload.acceptableCategories,
    opening_hours: mapOpeningHoursToApi(payload.openingHours),
  }

  const response = await apiRequest<ApiEnvelope<UpgradeToPartnerData>, UpgradeToPartnerRequest>(
    '/auth/upgrade-to-partner',
    {
      method: 'POST',
      body: requestPayload,
    },
  )

  return {
    user: normalizeUser(response.data.user),
    tokens: response.data.tokens
      ? {
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        accessTokenExpiry: response.data.tokens.accessTokenExpiry,
        refreshTokenExpiry: response.data.tokens.refreshTokenExpiry,
      }
      : undefined,
  }
}

export async function refreshAuthTokens(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await apiRequest<ApiEnvelope<RefreshData>, { refresh_token: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: { refresh_token: refreshToken },
      includeAuth: false,
      skipSessionRecovery: true,
      signal,
    },
  )

  return {
    user: normalizeUser(response.data.user),
    tokens: { ...mapTokens(response.data), refreshToken: response.data.tokens.refreshToken ?? refreshToken },
  }
}
