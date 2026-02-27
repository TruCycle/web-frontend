export interface ApiEnvelope<TData> {
  readonly status: string
  readonly message: string
  readonly data: TData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function unwrapApiData<TData>(value: unknown): TData {
  if (isRecord(value) && 'data' in value) {
    return (value as unknown as ApiEnvelope<TData>).data
  }

  return value as TData
}
