import { env } from '@/config/env'

/**
 * Base URL for Identity Service. All protected requests must include
 * Authorization: Bearer <token> (attach token when calling, e.g. from AuthContext).
 */
export function getIdentityBaseUrl(): string {
  return env.apiIdentityUrl
}

/**
 * Build full URL for an Identity Service path.
 */
export function identityUrl(path: string): string {
  const base = getIdentityBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : ''
}

/**
 * Fetch with optional Bearer token. Use this for all Identity Service calls.
 * Attaches Authorization: Bearer <token> when token is provided.
 * TODO: In each feature, implement the actual call and handle response (JSON parse)
 * and errors (4xx/5xx, network errors) where the endpoint is invoked.
 *
 * Example (to implement in login feature):
 *   const res = await fetchWithAuth(identityUrl(endpoints.auth.login), {
 *     method: 'POST',
 *     body: new URLSearchParams({ username, password }),
 *     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 *   }, null);
 *   const data = await res.json();
 *   if (!res.ok) throw new Error(data.detail ?? 'Request failed');
 *   return data;
 */
export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  token: string | null = null
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...init, headers })
}
