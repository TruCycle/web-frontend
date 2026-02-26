import type {
  AuthTokens,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
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
  readonly user: ApiAuthUser
}

function normalizeUser(user: ApiAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? user.first_name ?? '',
    lastName: user.lastName ?? user.last_name ?? '',
    status: user.status,
    postcode: user.postcode,
    roles: user.roles,
  }
}

function mapTokens(payload: AuthDataWithTokens): AuthTokens {
  return {
    accessToken: payload.tokens.accessToken,
    refreshToken: payload.tokens.refreshToken,
    accessTokenExpiry: payload.tokens.accessTokenExpiry,
    refreshTokenExpiry: payload.tokens.refreshTokenExpiry,
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithoutTokens>, {
    first_name: string
    last_name: string
    email: string
    password: string
  }>('/auth/register', {
    method: 'POST',
    body: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
    },
  })

  return normalizeUser(response.data.user)
}

export async function loginUser(
  payload: LoginPayload,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithTokens>, LoginPayload>(
    '/auth/login',
    {
      method: 'POST',
      body: payload,
    },
  )

  return {
    user: normalizeUser(response.data.user),
    tokens: mapTokens(response.data),
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<AuthDataWithoutTokens>>('/auth/me')
  return normalizeUser(response.data.user)
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<ApiEnvelope<null>, { email: string }>('/auth/forget-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest<ApiEnvelope<null>, { token: string; new_password: string }>(
    '/auth/reset-password',
    {
      method: 'POST',
      body: {
        token: payload.token,
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

export async function refreshAuthTokens(refreshToken: string): Promise<AuthTokens> {
  const response = await apiRequest<ApiEnvelope<RefreshData>, { refresh_token: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body: { refresh_token: refreshToken },
    },
  )

  return {
    accessToken: response.data.tokens.accessToken,
    refreshToken: response.data.tokens.refreshToken ?? refreshToken,
    accessTokenExpiry: response.data.tokens.accessTokenExpiry,
    refreshTokenExpiry: response.data.tokens.refreshTokenExpiry,
  }
}
