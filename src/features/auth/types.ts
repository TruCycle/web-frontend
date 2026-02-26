export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly status?: string
  readonly postcode?: string
  readonly roles?: readonly string[]
}

export interface AuthTokens {
  readonly accessToken: string
  readonly refreshToken?: string
  readonly accessTokenExpiry?: string
  readonly refreshTokenExpiry?: string
}

export interface RegisterPayload {
  readonly firstName: string
  readonly lastName: string
  readonly email: string
  readonly password: string
}

export interface LoginPayload {
  readonly email: string
  readonly password: string
}

export interface ResetPasswordPayload {
  readonly token: string
  readonly newPassword: string
}
