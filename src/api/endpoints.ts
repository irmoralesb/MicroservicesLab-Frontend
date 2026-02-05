/**
 * URL path constants for Identity Service API.
 * Use with api/client base URL to form full URLs.
 */
export const endpoints = {
  auth: {
    login: '/api/v1/auth/login',
    createUser: '/api/v1/auth',
    unlockAccount: '/api/v1/auth/unlock-account',
  },
  profile: {
    me: '/api/v1/profile/current',
    selected: (userId: string) => '/api/v1/profile/${userId}',
    all: '/api/v1/profile/all',
    update: '/api/v1/profile',
    activate: (userId: string) => `/api/v1/profile/${userId}/activate`,
    deactivate: (userId: string) => `/api/v1/profile/${userId}/deactivate`,
    delete: (userId: string) => `/api/v1/profile/${userId}`,
  },
} as const
