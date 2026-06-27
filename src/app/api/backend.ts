export const backendApiBaseUrl =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  'http://127.0.0.1:3000'

export function createBackendHeaders(init?: HeadersInit) {
  const headers = new Headers(init)
  const token = process.env.BACKEND_API_TOKEN

  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  return headers
}
