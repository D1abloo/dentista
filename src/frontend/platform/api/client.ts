export type ApiEnvelope<T> = {
  data?: T
  error?: { message?: string; code?: string }
  meta?: Record<string, unknown>
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const platformFetch = async <T>(
  url: string,
  init?: RequestInit
): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  })
  const json = (await res.json()) as ApiEnvelope<T>
  if (!res.ok) {
    throw new ApiError(json.error?.message ?? 'Error de servidor', res.status)
  }
  return json.data as T
}
