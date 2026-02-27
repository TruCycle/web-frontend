import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'

interface UpdateProfilePayload {
  readonly firstName: string
  readonly lastName: string
  readonly phone?: string
  readonly postcode?: string
}

interface UpdatedProfile {
  readonly firstName: string
  readonly lastName: string
  readonly phone: string | null
  readonly postcode: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export async function updateCurrentUserProfile(
  payload: UpdateProfilePayload,
): Promise<UpdatedProfile> {
  const response = await apiRequest<unknown, Record<string, string>>('/users/me/profile', {
    method: 'PATCH',
    body: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.postcode ? { postcode: payload.postcode } : {}),
    },
  })

  const data = asRecord(unwrapApiData<unknown>(response))

  return {
    firstName: readString(data?.first_name) ?? payload.firstName,
    lastName: readString(data?.last_name) ?? payload.lastName,
    phone: readString(data?.phone),
    postcode: readString(data?.postcode),
  }
}
