/**
 * Environment configuration. Vite exposes env vars prefixed with VITE_.
 */
const identityBaseUrl = import.meta.env.VITE_API_IDENTITY_URL

export const env = {
  /** Base URL for the Identity Service (e.g. http://localhost:8000) */
  apiIdentityUrl: typeof identityBaseUrl === 'string' && identityBaseUrl
    ? identityBaseUrl.replace(/\/$/, '')
    : '',
} as const
