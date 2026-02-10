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
    selected: (userId: string) => `/api/v1/profile/${userId}`,
    all: '/api/v1/profile/all',
    update: '/api/v1/profile',
    activate: (userId: string) => `/api/v1/profile/${userId}/activate`,
    deactivate: (userId: string) => `/api/v1/profile/${userId}/deactivate`,
    delete: (userId: string) => `/api/v1/profile/${userId}`,
  },
  services: {
    all: '/api/v1/services',
    selected: (serviceId: string) => `/api/v1/services/${serviceId}`,
    create: '/api/v1/services',
    update: (serviceId: string) => `/api/v1/services/${serviceId}`,
    delete: (serviceId: string) => `/api/v1/services/${serviceId}`,
  },
  roles: {
    list: (serviceId: string) => `/api/v1/roles/${serviceId}`,
    create: '/api/v1/roles',
    update: (roleId: string) => `/api/v1/roles/${roleId}`,
    delete: (roleId: string) => `/api/v1/roles/${roleId}`,
    assign: '/api/v1/roles/assign',
    unassign: '/api/v1/roles/unassign',
    userRoles: (userId: string) => `/api/v1/roles/user/${userId}`,
  },
} as const
